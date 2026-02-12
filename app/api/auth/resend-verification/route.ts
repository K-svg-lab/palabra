/**
 * API Route: Resend Verification Email
 * Handles resending email verification for users who didn't receive it
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { createVerificationToken, checkTokenRateLimit } from '@/lib/backend/tokens';
import { sendVerificationEmail } from '@/lib/backend/email';
import {
  apiResponse,
  apiError,
  parseBody,
  withApiHandler,
  requireAuth,
} from '@/lib/backend/api-utils';

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }
  
  // Require authentication (user must be signed in)
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    return authResult;
  }
  
  const { userId } = authResult;
  
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });
    
    if (!user) {
      return apiError('User not found', 404);
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return apiResponse({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }
    
    // Check rate limiting (3 requests per hour)
    if (!checkTokenRateLimit(user.email, 3, 3600000)) {
      return apiError(
        'Too many verification email requests. Please try again in an hour.',
        429
      );
    }
    
    // Create new verification token
    const { token } = await createVerificationToken(user.email);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    // Send verification email
    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name || undefined,
      verificationUrl,
    });
    
    if (!emailResult.success) {
      return apiError('Failed to send verification email', 500);
    }
    
    console.log('[ResendVerification] Verification email sent to:', user.email);
    
    return apiResponse({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('[ResendVerification] Error:', error);
    return apiError('Failed to resend verification email', 500);
  }
}

export const POST = withApiHandler(handler);
