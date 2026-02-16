/**
 * API Route: Sync Reviews
 * Handles review synchronization between client and server
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { requireAuth, apiResponse, apiError, parseBody, withApiHandler } from '@/lib/backend/api-utils';
import type { SyncOperation } from '@/lib/types/sync';

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
  }>(request);
  
  if (!body) {
    return apiError('Invalid request body', 400);
  }
  
  const { lastSyncTime, operations } = body;
  
  try {
    const processed: string[] = [];
    const errors: any[] = [];
    
    // Process incoming review progress (ReviewRecords)
    // These contain SM-2 algorithm data for vocabulary items
    for (const operation of operations) {
      try {
        const { data } = operation;
        
        // Update the vocabulary item with review progress
        await prisma.vocabularyItem.update({
          where: {
            id: data.vocabId,
            userId,
          },
          data: {
            easeFactor: data.easeFactor,
            interval: data.interval,
            repetitions: data.repetition,
            lastReviewDate: data.lastReviewDate ? new Date(data.lastReviewDate) : null,
            nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
            lastSyncedAt: new Date(),
          },
        });
        
        processed.push(operation.id);
      } catch (error: any) {
        errors.push({
          operation: operation.id,
          error: error.message,
        });
      }
    }
    
    // Get vocabulary items with review progress updated since last sync
    // Return as ReviewRecords for the client
    const updatedVocab = await prisma.vocabularyItem.findMany({
      where: {
        userId,
        lastSyncedAt: lastSyncTime ? {
          gt: new Date(lastSyncTime),
        } : undefined,
        // Only include items that have been reviewed (have review data)
        lastReviewDate: {
          not: null,
        },
      },
      select: {
        id: true,
        easeFactor: true,
        interval: true,
        repetitions: true,
        lastReviewDate: true,
        nextReviewDate: true,
      },
      // NO LIMIT: Allow users to sync all review records
      // For users with thousands of words, this ensures all review data is synced
      orderBy: {
        lastReviewDate: 'desc',
      },
    });
    
    // Transform to ReviewRecord format
    const remoteReviews = updatedVocab.map(v => ({
      id: `review-${v.id}`,
      vocabId: v.id,
      easeFactor: v.easeFactor,
      interval: v.interval,
      repetition: v.repetitions,
      lastReviewDate: v.lastReviewDate?.getTime() || null,
      nextReviewDate: v.nextReviewDate?.getTime() || null,
      totalReviews: v.repetitions, // Approximate
      correctCount: v.repetitions, // Approximate
      incorrectCount: 0, // Not tracked in VocabularyItem
    }));
    
    return apiResponse({
      success: true,
      timestamp: new Date().toISOString(),
      reviews: remoteReviews,
      processed: processed.length,
      errors,
    });
  } catch (error) {
    console.error('Sync reviews error:', error);
    return apiError('Failed to sync reviews', 500);
  }
}

export const POST = withApiHandler(handler);

