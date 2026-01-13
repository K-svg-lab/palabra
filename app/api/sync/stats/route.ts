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
        
        await prisma.dailyStats.upsert({
          where: {
            userId_date: {
              userId,
              date: new Date(data.date),
            },
          },
          create: {
            ...data,
            userId,
            date: new Date(data.date),
            lastSyncedAt: new Date(),
          },
          update: {
            ...data,
            version: { increment: 1 },
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
    
    return apiResponse({
      success: true,
      timestamp: new Date().toISOString(),
      stats: remoteStats,
      processed: processed.length,
      errors,
    });
  } catch (error) {
    console.error('Sync stats error:', error);
    return apiError('Failed to sync stats', 500);
  }
}

export const POST = withApiHandler(handler);

