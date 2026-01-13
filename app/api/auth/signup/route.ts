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
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return apiError('Invalid email format', 400);
  }
  
  // Validate password strength
  if (password.length < 8) {
    return apiError('Password must be at least 8 characters', 400);
  }
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return apiError('User with this email already exists', 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
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
    
    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);
    
    return apiResponse({
      success: true,
      user,
      message: 'Account created successfully',
    }, 201);
  } catch (error) {
    console.error('Sign up error:', error);
    return apiError('Failed to create account', 500);
  }
}

export const POST = withApiHandler(handler);

