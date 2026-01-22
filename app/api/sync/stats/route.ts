/**
 * API Route: Sync Stats
 * Handles daily stats synchronization between client and server
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
    
    // Process incoming stats
    for (const operation of operations) {
      try {
        const { data } = operation;
        
        // #region agent log
        console.log('[DEBUG H4] Server received stats operation:', JSON.stringify({date:data.date,cardsReviewed:data.cardsReviewed,newWordsAdded:data.newWordsAdded,accuracyRate:data.accuracyRate,timeSpent:data.timeSpent,userId}));
        // #endregion
        
        // Map client field names to Prisma schema field names
        const statsData = {
          date: new Date(data.date),
          wordsAdded: data.newWordsAdded || 0,
          cardsReviewed: data.cardsReviewed || 0,
          correctReviews: Math.round((data.cardsReviewed || 0) * (data.accuracyRate || 0)),
          studyTime: data.timeSpent || 0,
          sessionsCompleted: data.sessionsCompleted || 0,
          isActive: (data.cardsReviewed || 0) > 0,
        };
        
        // #region agent log
        console.log('[DEBUG H4] Before upsert:', JSON.stringify({date:data.date,statsToUpsert:{cardsReviewed:statsData.cardsReviewed,wordsAdded:statsData.wordsAdded,studyTime:statsData.studyTime},userId}));
        // #endregion
        
        await prisma.dailyStats.upsert({
          where: {
            userId_date: {
              userId,
              date: statsData.date,
            },
          },
          create: {
            ...statsData,
            userId,
            lastSyncedAt: new Date(),
          },
          update: {
            ...statsData,
            version: { increment: 1 },
            lastSyncedAt: new Date(),
          },
        });
        
        // #region agent log
        console.log('[DEBUG H4] After upsert - stats saved:', JSON.stringify({date:data.date,savedData:{cardsReviewed:statsData.cardsReviewed,wordsAdded:statsData.wordsAdded},userId}));
        // #endregion
        
        processed.push(operation.id);
      } catch (error: any) {
        errors.push({
          operation: operation.id,
          error: error.message,
        });
      }
    }
    
    // Get remote changes since last sync
    const remoteStats = await prisma.dailyStats.findMany({
      where: {
        userId,
        lastSyncedAt: lastSyncTime ? {
          gt: new Date(lastSyncTime),
        } : undefined,
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    // #region agent log
    console.log('[DEBUG H4] Server sending stats to client:', JSON.stringify({lastSyncTime,statsCount:remoteStats.length,stats:remoteStats.map(s=>({date:s.date.toISOString().split('T')[0],cardsReviewed:s.cardsReviewed,wordsAdded:s.wordsAdded})),userId}));
    // #endregion
    
    // Transform back to client format
    const transformedStats = remoteStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0], // YYYY-MM-DD format
      newWordsAdded: stat.wordsAdded,
      cardsReviewed: stat.cardsReviewed,
      sessionsCompleted: stat.sessionsCompleted,
      accuracyRate: stat.cardsReviewed > 0 ? stat.correctReviews / stat.cardsReviewed : 0,
      timeSpent: stat.studyTime,
    }));
    
    return apiResponse({
      success: true,
      timestamp: new Date().toISOString(),
      stats: transformedStats,
      processed: processed.length,
      errors,
    });
  } catch (error) {
    console.error('Sync stats error:', error);
    return apiError('Failed to sync stats', 500);
  }
}

export const POST = withApiHandler(handler);

