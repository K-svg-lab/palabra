/**
 * API Route: Sync Vocabulary
 * Handles vocabulary synchronization between client and server
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { requireAuth, apiResponse, apiError, parseBody, withApiHandler } from '@/lib/backend/api-utils';
import type { SyncOperation, SyncConflict } from '@/lib/types/sync';

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }
  
  // Require authentication
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    return authResult;
  }
  
  const { userId } = authResult;
  
  // Parse request body
  const body = await parseBody<{
    lastSyncTime?: string;
    operations: SyncOperation[];
    deviceId: string;
  }>(request);
  
  if (!body) {
    return apiError('Invalid request body', 400);
  }
  
  const { lastSyncTime, operations, deviceId } = body;
  
  try {
    const conflicts: SyncConflict[] = [];
    const processed: SyncOperation[] = [];
    const errors: any[] = [];
    const modifiedItemIds: Set<string> = new Set(); // Track items modified in this request
    
    // Process incoming operations FIRST before querying remote changes
    // This ensures the client gets back the latest data including their own updates
    for (const operation of operations) {
      try {
        switch (operation.operation) {
          case 'create':
            await handleCreate(userId, operation, conflicts);
            modifiedItemIds.add(operation.id);
            break;
          case 'update':
            await handleUpdate(userId, operation, conflicts);
            modifiedItemIds.add(operation.id);
            break;
          case 'delete':
            await handleDelete(userId, operation, conflicts);
            modifiedItemIds.add(operation.id);
            break;
        }
        processed.push(operation);
      } catch (error: any) {
        errors.push({
          operation,
          error: error.message,
        });
      }
    }
    
    // Get remote changes since last sync AFTER processing incoming operations
    // Include items that were either updated OR synced since lastSyncTime
    // ALSO include items that were just modified in this request (to avoid race condition)
    const remoteChanges = await prisma.vocabularyItem.findMany({
      where: {
        userId,
        OR: lastSyncTime ? [
          { lastSyncedAt: { gt: new Date(lastSyncTime) } },
          { updatedAt: { gt: new Date(lastSyncTime) } },
          { id: { in: Array.from(modifiedItemIds) } }, // Include items just modified
        ] : undefined,
      },
      take: 1000, // Limit to prevent huge responses
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Update device info
    await updateDeviceInfo(userId, deviceId);
    
    // Create sync log
    await prisma.syncLog.create({
      data: {
        userId,
        syncType: 'incremental',
        direction: 'bidirectional',
        status: conflicts.length > 0 ? 'completed' : 'completed',
        itemsSynced: processed.length,
        conflictsFound: conflicts.length,
        conflictsResolved: 0,
        errors: errors.length > 0 ? errors : undefined,
        deviceId,
      },
    });
    
    // #region agent log Backend Response
    console.log(`[Vocab Sync] Sending ${remoteChanges.length} items to client, statuses: ${remoteChanges.map((i: any) => `${i.spanish}:${i.status}`).join(', ')}`);
    // #endregion
    return apiResponse({
      success: true,
      timestamp: new Date().toISOString(),
      operations: remoteChanges.map((item: any) => ({
        id: item.id,
        entityType: 'vocabulary',
        operation: 'update',
        // Map database field names back to client field names
        data: {
          ...item,
          spanishWord: item.spanish,
          englishTranslation: item.english,
          audioUrl: item.audio,
          relationships: {
            synonyms: item.synonyms || [],
            antonyms: item.antonyms || [],
            related: item.relatedWords || [],
          },
          createdAt: new Date(item.createdAt).getTime(),
          updatedAt: new Date(item.updatedAt).getTime(),
        },
        timestamp: item.updatedAt,
      })),
      conflicts,
      processed: processed.length,
      errors,
    });
  } catch (error) {
    console.error('Sync vocabulary error:', error);
    return apiError('Failed to sync vocabulary', 500);
  }
}

async function handleCreate(
  userId: string,
  operation: SyncOperation,
  conflicts: SyncConflict[]
) {
  const { data } = operation;
  
  // Check if item already exists
  const existing = await prisma.vocabularyItem.findFirst({
    where: {
      id: data.id,
      userId,
    },
  });
  
  if (existing) {
    // Conflict: item already exists
    conflicts.push({
      id: crypto.randomUUID(),
      entityType: 'vocabulary',
      entityId: data.id,
      localData: existing,
      remoteData: data,
      localVersion: existing.version,
      remoteVersion: data.version || 1,
      localTimestamp: existing.updatedAt,
      remoteTimestamp: data.updatedAt || new Date(),
      suggestedResolution: 'newest',
    });
    return;
  }
  
  // Create new item
  // Map field names from client (spanishWord/englishTranslation) to database (spanish/english)
  const createdAtDate = data.createdAt ? new Date(data.createdAt) : undefined;
  const updatedAtDate = data.updatedAt ? new Date(data.updatedAt) : undefined;
  
  const created = await prisma.vocabularyItem.create({
    data: {
      id: data.id,
      userId,
      spanish: data.spanishWord || data.spanish,
      english: data.englishTranslation || data.english,
      partOfSpeech: data.partOfSpeech,
      gender: data.gender,
      level: data.level || 'beginner',
      examples: data.examples,
      notes: data.notes,
      images: data.images,
      audio: data.audio || data.audioUrl,
      synonyms: data.relationships?.synonyms || data.synonyms,
      antonyms: data.relationships?.antonyms || data.antonyms,
      relatedWords: data.relationships?.related || data.relatedWords,
      status: data.status,
      difficulty: data.difficulty || 0,
      easeFactor: data.easeFactor || 2.5,
      interval: data.interval || 0,
      repetitions: data.repetitions || 0,
      createdAt: createdAtDate,
      updatedAt: updatedAtDate,
      lastSyncedAt: new Date(),
    },
  });
}

async function handleUpdate(
  userId: string,
  operation: SyncOperation,
  conflicts: SyncConflict[]
) {
  const { data } = operation;
  
  // Get existing item
  const existing = await prisma.vocabularyItem.findFirst({
    where: {
      id: data.id,
      userId,
    },
  });
  
  if (!existing) {
    // Item doesn't exist, create it
    await handleCreate(userId, operation, conflicts);
    return;
  }
  
  // Check for conflict
  if (existing.version > (operation.localVersion || 0)) {
    conflicts.push({
      id: crypto.randomUUID(),
      entityType: 'vocabulary',
      entityId: data.id,
      localData: existing,
      remoteData: data,
      localVersion: existing.version,
      remoteVersion: data.version || existing.version,
      localTimestamp: existing.updatedAt,
      remoteTimestamp: data.updatedAt || new Date(),
      suggestedResolution: 'newest',
    });
    return;
  }
  
  // Update item
  // Map field names from client to database
  // #region agent log Backend Update
  console.log(`[Vocab Sync] Updating item ${data.id}, incoming status: ${data.status}, spanish: ${data.spanishWord || data.spanish}`);
  // #endregion
  const updateData = {
    spanish: data.spanishWord || data.spanish,
    english: data.englishTranslation || data.english,
    partOfSpeech: data.partOfSpeech,
    gender: data.gender,
    level: data.level,
    examples: data.examples,
    notes: data.notes,
    images: data.images,
    audio: data.audio || data.audioUrl,
    synonyms: data.relationships?.synonyms || data.synonyms,
    antonyms: data.relationships?.antonyms || data.antonyms,
    relatedWords: data.relationships?.related || data.relatedWords,
    status: data.status,
    difficulty: data.difficulty,
    easeFactor: data.easeFactor,
    interval: data.interval,
    repetitions: data.repetitions,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    version: { increment: 1 },
    lastSyncedAt: new Date(),
  };
  // #region agent log Backend Update Data
  console.log(`[Vocab Sync] Update data for ${data.id}:`, JSON.stringify({status: updateData.status, spanish: updateData.spanish}));
  // #endregion
  const updated = await prisma.vocabularyItem.update({
    where: { id: data.id },
    data: updateData,
  });
  // #region agent log Backend After Update
  console.log(`[Vocab Sync] After DB update ${data.id}, status in DB:`, updated.status);
  // #endregion
}

async function handleDelete(
  userId: string,
  operation: SyncOperation,
  conflicts: SyncConflict[]
) {
  const { data } = operation;
  
  // Soft delete
  await prisma.vocabularyItem.update({
    where: { id: data.id },
    data: {
      isDeleted: true,
      version: { increment: 1 },
      lastSyncedAt: new Date(),
    },
  });
}

async function updateDeviceInfo(userId: string, deviceId: string) {
  await prisma.deviceInfo.upsert({
    where: { deviceId },
    create: {
      userId,
      deviceId,
      deviceName: 'Unknown Device',
      deviceType: 'desktop',
      platform: 'unknown',
      lastActiveAt: new Date(),
      lastSyncAt: new Date(),
    },
    update: {
      lastActiveAt: new Date(),
      lastSyncAt: new Date(),
    },
  });
}

export const POST = withApiHandler(handler);

