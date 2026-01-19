/**
 * API Route: Get Current User
 * Returns the currently authenticated user
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { requireAuth } from '@/lib/backend/api-utils';
import { apiResponse, apiError, withApiHandler } from '@/lib/backend/api-utils';

async function handler(request: NextRequest) {
  if (request.method !== 'GET') {
    return apiError('Method not allowed', 405);
  }
  
  // Require authentication
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    return authResult;
  }
  
  const { userId } = authResult;
  
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return apiError('User not found', 404);
    }
    
    return apiResponse({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return apiError('Failed to get user data', 500);
  }
}

export const GET = withApiHandler(handler);

