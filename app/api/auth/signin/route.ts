/**
 * API Route: Sign In
 * Handles user authentication
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/backend/db';
import { verifyPassword, createSession, setSessionCookie, checkRateLimit } from '@/lib/backend/auth';
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
    email: string;
    password: string;
  }>(request);
  
  if (!body) {
    return apiError('Invalid request body', 400);
  }
  
  // Validate required fields
  const validationError = validateFields(body, ['email', 'password']);
  if (validationError) {
    return apiError(validationError, 400);
  }
  
  const { email, password } = body;
  // Normalize email so lookup works regardless of casing (localhost vs production consistency)
  const emailNormalized = email.trim().toLowerCase();

  // Rate limiting
  if (!checkRateLimit(emailNormalized, 5, 300000)) { // 5 attempts per 5 minutes
    return apiError('Too many login attempts. Please try again later.', 429);
  }

  try {
    // Find user: try normalized email first, then original (for existing mixed-case accounts)
    let user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user && email !== emailNormalized) {
      user = await prisma.user.findUnique({
        where: { email: email.trim() },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          password: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (!user || !user.password) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SignIn] User not found or no password:', emailNormalized);
      }
      return apiError('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SignIn] Password mismatch for:', emailNormalized);
      }
      return apiError('Invalid email or password', 401);
    }
    
    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return apiResponse({
      success: true,
      user: userWithoutPassword,
      message: 'Signed in successfully',
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return apiError('Failed to sign in', 500);
  }
}

export const POST = withApiHandler(handler);

