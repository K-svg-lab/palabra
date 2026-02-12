/**
 * API Route: Forgot Password
 * Handles password reset request - sends email with reset link
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { createPasswordResetToken, checkTokenRateLimit } from '@/lib/backend/tokens';
import { sendPasswordResetEmail } from '@/lib/backend/email';
import {
  apiResponse,
  apiError,
  parseBody,
  validateFields,
  withApiHandler,
} from '@/lib/backend/api-utils';

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return apiError('Method not allowed', 405);
  }
  
  // Parse request body
  const body = await parseBody<{ email: string }>(request);
  
  if (!body) {
    return apiError('Invalid request body', 400);
  }
  
  // Validate required fields
  const validationError = validateFields(body, ['email']);
  if (validationError) {
    return apiError(validationError, 400);
  }
  
  const { email } = body;
  const emailNormalized = email.trim().toLowerCase();
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailNormalized)) {
    return apiError('Invalid email format', 400);
  }
  
  try {
    // Check rate limiting (5 requests per hour)
    if (!checkTokenRateLimit(emailNormalized, 5, 3600000)) {
      return apiError(
        'Too many password reset requests. Please try again in an hour.',
        429
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log('[ForgotPassword] User not found for email:', emailNormalized);
      // Still return success to prevent email enumeration
      return apiResponse({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }
    
    // Create password reset token
    const { token } = await createPasswordResetToken(user.email);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name || undefined,
      resetUrl,
    });
    
    if (!emailResult.success) {
      console.error('[ForgotPassword] Failed to send email:', emailResult.error);
      return apiError('Failed to send password reset email', 500);
    }
    
    console.log('[ForgotPassword] Password reset email sent to:', user.email);
    
    return apiResponse({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[ForgotPassword] Error:', error);
    return apiError('Failed to process password reset request', 500);
  }
}

export const POST = withApiHandler(handler);
