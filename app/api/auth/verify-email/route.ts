/**
 * API Route: Verify Email
 * Handles email verification from verification link
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { verifyEmailToken } from '@/lib/backend/tokens';
import {
  apiResponse,
  apiError,
  parseBody,
  withApiHandler,
} from '@/lib/backend/api-utils';

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }
  
  // Parse request body
  const body = await parseBody<{ token: string }>(request);
  
  if (!body || !body.token) {
    return apiError('Verification token is required', 400);
  }
  
  const { token } = body;
  
  try {
    // Verify token
    const tokenResult = await verifyEmailToken(token);
    
    if (!tokenResult.valid || !tokenResult.email) {
      return apiError(tokenResult.error || 'Invalid verification token', 400);
    }
    
    const { email } = tokenResult;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return apiError('User not found', 404);
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return apiResponse({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }
    
    // Mark email as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });
    
    console.log('[VerifyEmail] Email verified for:', email);
    
    return apiResponse({
      success: true,
      message: 'Email verified successfully',
      verified: true,
    });
  } catch (error) {
    console.error('[VerifyEmail] Error:', error);
    return apiError('Failed to verify email', 500);
  }
}

export const POST = withApiHandler(handler);
