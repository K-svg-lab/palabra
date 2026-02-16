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
    const errors: Array<{ operation: string; error: string }> = [];
    
    console.log(`[Sync] Processing ${operations.length} review operations`);
    
    // Process incoming review results
    // These can be individual review attempts (ExtendedReviewResult) or aggregated review records
    for (const operation of operations) {
      try {
        const { data } = operation;
        
        // Check if this is an individual review result (has rating, vocabularyId, reviewedAt)
        // or an aggregated review record (has vocabId, easeFactor, interval)
        const isIndividualReview = data.rating !== undefined && data.vocabularyId !== undefined;
        
        if (isIndividualReview) {
          // Individual review attempt - create Review record in PostgreSQL
          console.log(`[Sync] Creating individual Review record for vocab: ${data.vocabularyId}`);
          
          // Map rating to quality (0-5)
          const qualityMap: Record<string, number> = {
            'forgot': 0,
            'hard': 2,
            'good': 4,
            'easy': 5
          };
          const quality = qualityMap[data.rating] || 3;
          
          // Map direction
          const directionMap: Record<string, string> = {
            'spanish-to-english': 'spanish-english',
            'english-to-spanish': 'english-spanish',
            'mixed': 'spanish-english' // Default to spanish-english for mixed
          };
          const direction = directionMap[data.direction] || 'spanish-english';
          
          try {
            await prisma.review.create({
              data: {
                userId,
                vocabularyId: data.vocabularyId,
                reviewType: data.mode || 'recognition',
                direction,
                quality,
                timeSpent: data.timeSpent || 0,
                correct: data.rating !== 'forgot',
                reviewDate: data.reviewedAt ? new Date(data.reviewedAt) : new Date(),
                difficulty: data.difficultyMultiplier || 1.0,
                interval: 0, // Individual attempts don't have interval (that's in ReviewRecord)
              },
            });
            console.log(`[Sync] ✅ Created Review record for vocab ${data.vocabularyId}, rating: ${data.rating}`);
          } catch (reviewError) {
            // If review creation fails, log but don't fail the entire sync
            const errorMessage = reviewError instanceof Error ? reviewError.message : 'Unknown error';
            console.warn(`[Sync] ⚠️ Could not create Review record:`, errorMessage);
          }
        } else if (data.vocabId) {
          // Aggregated review record - update VocabularyItem with SM-2 data
          console.log(`[Sync] Updating VocabularyItem SM-2 data for vocab: ${data.vocabId}`);
          
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
          console.log(`[Sync] ✅ Updated VocabularyItem for vocab ${data.vocabId}`);
        }
        
        processed.push(operation.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Sync] ❌ Error processing operation ${operation.id}:`, errorMessage);
        errors.push({
          operation: operation.id,
          error: errorMessage,
        });
      }
    }
    
    console.log(`[Sync] ✅ Processed ${processed.length} operations, ${errors.length} errors`);

    
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

