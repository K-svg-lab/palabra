/**
 * API Route: Sign Out
 * Handles user sign out
 */

import { NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/backend/auth';
import { apiResponse, apiError, withApiHandler } from '@/lib/backend/api-utils';

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }
  
  try {
    await clearSessionCookie();
    
    return apiResponse({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return apiError('Failed to sign out', 500);
  }
}

export const POST = withApiHandler(handler);

