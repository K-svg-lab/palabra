/**
 * API Route: Sign Up
 * Handles user registration
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { hashPassword, createSession, setSessionCookie } from '@/lib/backend/auth';
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
    name: string;
    email: string;
    password: string;
  }>(request);
  
  if (!body) {
    return apiError('Invalid request body', 400);
  }
  
  // Validate required fields
  const validationError = validateFields(body, ['name', 'email', 'password']);
  if (validationError) {
    return apiError(validationError, 400);
  }
  
  const { name, email, password } = body;
  const emailNormalized = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailNormalized)) {
    return apiError('Invalid email format', 400);
  }
  
  // Validate password strength
  if (password.length < 8) {
    return apiError('Password must be at least 8 characters', 400);
  }
  
  try {
    // Check if user already exists (by normalized email)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return apiError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (store normalized email for consistent lookups)
    const user = await prisma.user.create({
      data: {
        name,
        email: emailNormalized,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Create default settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    });
    
    // Send verification email (don't block on email sending)
    try {
      const { createVerificationToken } = await import('@/lib/backend/tokens');
      const { sendVerificationEmail } = await import('@/lib/backend/email');
      
      const { token: verificationToken } = await createVerificationToken(emailNormalized);
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      // Send email (non-blocking)
      sendVerificationEmail({
        email: emailNormalized,
        name: name,
        verificationUrl,
      }).catch(error => {
        console.error('[SignUp] Failed to send verification email:', error);
        // Don't fail signup if email fails
      });
      
      console.log('[SignUp] Verification email queued for:', emailNormalized);
    } catch (emailError) {
      console.error('[SignUp] Error sending verification email:', emailError);
      // Don't fail signup if email fails
    }
    
    // Create session (allow unverified users to sign in)
    const token = await createSession(user.id);
    await setSessionCookie(token);
    
    return apiResponse({
      success: true,
      user,
      message: 'Account created successfully. Please check your email to verify your account.',
      emailSent: true,
    }, 201);
  } catch (error) {
    console.error('Sign up error:', error);
    return apiError('Failed to create account', 500);
  }
}

export const POST = withApiHandler(handler);

