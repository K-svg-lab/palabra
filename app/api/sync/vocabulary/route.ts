/**
 * API Route: Sync Vocabulary
 * Handles vocabulary synchronization between client and server
 * Updated: 2026-01-15
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
    // CRITICAL FIX: Include recently deleted items so clients can remove them locally
    const remoteChanges = await prisma.vocabularyItem.findMany({
      where: {
        userId,
        // Note: If lastSyncTime exists, use OR conditions, otherwise get all NON-DELETED items
        ...(lastSyncTime ? {
          OR: [
            { lastSyncedAt: { gt: new Date(lastSyncTime) } },
            { updatedAt: { gt: new Date(lastSyncTime) } },
            { id: { in: Array.from(modifiedItemIds) } }, // Include items just modified
          ]
          // Don't filter isDeleted here - we need to send deletions to clients
        } : {
          // For full sync (no lastSyncTime), only send non-deleted items
          isDeleted: false
        }),
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
    
    // Map remote changes to sync operations
    const syncOperations = remoteChanges.map((item: any) => ({
      id: item.id,
      entityType: 'vocabulary' as const,
      operation: 'update' as const,
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
        isDeleted: item.isDeleted, // CRITICAL: Pass deletion flag to client
      },
      timestamp: item.updatedAt,
    }));
    
    // Log deleted items being sent to client for debugging
    const deletedItems = syncOperations.filter(op => op.data.isDeleted);
    if (deletedItems.length > 0) {
      console.log(`📤 Sending ${deletedItems.length} deleted items to client:`, deletedItems.map(d => d.data.spanishWord));
    }
    
    return apiResponse({
      success: true,
      timestamp: new Date().toISOString(),
      operations: syncOperations,
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
    isDeleted: data.isDeleted !== undefined ? data.isDeleted : undefined, // Handle soft deletes
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    version: { increment: 1 },
    lastSyncedAt: new Date(),
  };
  
  const updated = await prisma.vocabularyItem.update({
    where: { id: data.id },
    data: updateData,
  });
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

