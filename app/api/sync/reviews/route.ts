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
    
    // Process incoming reviews
    for (const operation of operations) {
      try {
        const { data } = operation;
        
        if (operation.operation === 'create') {
          await prisma.review.create({
            data: {
              ...data,
              userId,
              lastSyncedAt: new Date(),
            },
          });
        }
        
        processed.push(operation.id);
      } catch (error: any) {
        errors.push({
          operation: operation.id,
          error: error.message,
        });
      }
    }
    
    // Get remote changes since last sync
    const remoteReviews = await prisma.review.findMany({
      where: {
        userId,
        lastSyncedAt: lastSyncTime ? {
          gt: new Date(lastSyncTime),
        } : undefined,
      },
      take: 1000, // Limit to prevent huge payloads
      orderBy: {
        reviewDate: 'desc',
      },
    });
    
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

