/**
 * API Route: Reset Password
 * Handles password reset with valid token
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { verifyPasswordResetToken } from '@/lib/backend/tokens';
import { hashPassword } from '@/lib/backend/auth';
import { sendPasswordChangedEmail } from '@/lib/backend/email';
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
  const body = await parseBody<{
    token: string;
    password: string;
    confirmPassword: string;
  }>(request);
  
  if (!body) {
    return apiError('Invalid request body', 400);
  }
  
  // Validate required fields
  const validationError = validateFields(body, ['token', 'password', 'confirmPassword']);
  if (validationError) {
    return apiError(validationError, 400);
  }
  
  const { token, password, confirmPassword } = body;
  
  // Validate password match
  if (password !== confirmPassword) {
    return apiError('Passwords do not match', 400);
  }
  
  // Validate password strength
  if (password.length < 8) {
    return apiError('Password must be at least 8 characters', 400);
  }
  
  // Optional: Add more password strength requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  // if (!hasUpperCase || !hasLowerCase || !hasNumber) {
  //   return apiError('Password must contain uppercase, lowercase, and number', 400);
  // }
  
  try {
    // Verify reset token
    const tokenResult = await verifyPasswordResetToken(token);
    
    if (!tokenResult.valid || !tokenResult.email) {
      return apiError(tokenResult.error || 'Invalid or expired reset token', 400);
    }
    
    const { email } = tokenResult;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    if (!user) {
      return apiError('User not found', 404);
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // Optionally: Invalidate all existing sessions here
        updatedAt: new Date(),
      },
    });
    
    console.log('[ResetPassword] Password reset successfully for:', email);
    
    // Send confirmation email (non-blocking)
    sendPasswordChangedEmail(user.email, user.name || undefined).catch(error => {
      console.error('[ResetPassword] Failed to send confirmation email:', error);
      // Don't fail the reset if email fails
    });
    
    return apiResponse({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[ResetPassword] Error:', error);
    return apiError('Failed to reset password', 500);
  }
}

export const POST = withApiHandler(handler);
