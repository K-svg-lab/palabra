/**
 * API utility functions
 * Common utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';

/**
 * API response helper
 */
export function apiResponse<T = any>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * API error response helper
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const session = await getSession();
  
  if (!session) {
    return apiError('Unauthorized', 401);
  }
  
  return session;
}

/**
 * Parse request body with error handling
 */
export async function parseBody<T = any>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

/**
 * Validate required fields
 */
export function validateFields(
  data: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Parse query parameters
 */
export function getQueryParams(request: NextRequest): Record<string, string> {
  const params: Record<string, string> = {};
  const url = new URL(request.url);
  
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Parse pagination parameters
 */
export function getPaginationParams(request: NextRequest): {
  page: number;
  limit: number;
  offset: number;
} {
  const params = getQueryParams(request);
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '50')));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Handle API errors
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return apiError(error.message, 500, {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
  
  return apiError('Internal server error', 500);
}

/**
 * CORS headers for API routes
 */
export function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * Wrap API handler with error handling and CORS
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    try {
      const response = await handler(request, context);
      
      // Add CORS headers
      const headers = new Headers(response.headers);
      const corsHeaders = getCorsHeaders();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Rate limit check helper
 */
export async function checkApiRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<boolean> {
  // In production, implement with Redis or similar
  // For now, return true
  return true;
}

