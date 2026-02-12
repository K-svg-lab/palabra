/**
 * Authentication configuration and utilities
 * Simplified authentication for Phase 12 MVP
 * 
 * Note: This is a basic implementation. For production, consider:
 * - NextAuth.js for full OAuth support
 * - Clerk for managed authentication
 * - Supabase Auth for database-backed auth
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { AuthSession, UserProfile } from '@/lib/types/auth';

// Configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'palabra-session';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Create a session token
 */
export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SECRET_KEY);
  
  return token;
}

/**
 * Verify a session token
 */
export async function verifySession(token: string): Promise<{ userId: string } | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as { userId: string };
  } catch (error) {
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifySession(token);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Hash password using bcrypt (production-ready)
 * Uses 12 rounds (~400ms per hash) for security
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const SALT_ROUNDS = 12; // 2^12 iterations - good balance of security and performance
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password using bcrypt
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  
  // Handle legacy SHA-256 passwords (migration support)
  // SHA-256 hashes are 64 characters, bcrypt hashes are 60 characters
  if (hashedPassword.length === 64 && !hashedPassword.startsWith('$2')) {
    // This is a legacy SHA-256 hash - verify using old method
    // then rehash with bcrypt (handled by caller)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const legacyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return legacyHash === hashedPassword;
  }
  
  // Normal bcrypt verification
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if password hash is legacy SHA-256 format
 */
export function isLegacyPasswordHash(hashedPassword: string): boolean {
  return hashedPassword.length === 64 && !hashedPassword.startsWith('$2');
}

/**
 * Generate device ID
 */
export function generateDeviceId(): string {
  // In browser, can use combination of:
  // - User agent
  // - Screen resolution
  // - Timezone
  // - Language
  // For now, generate a random ID
  return crypto.randomUUID();
}

/**
 * Get device info from request headers
 */
export function getDeviceInfo(headers: Headers): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: string;
  browser: string;
} {
  const userAgent = headers.get('user-agent') || '';
  
  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }
  
  // Detect platform
  let platform = 'unknown';
  if (/windows/i.test(userAgent)) platform = 'Windows';
  else if (/mac/i.test(userAgent)) platform = 'macOS';
  else if (/linux/i.test(userAgent)) platform = 'Linux';
  else if (/android/i.test(userAgent)) platform = 'Android';
  else if (/ios|iphone|ipad/i.test(userAgent)) platform = 'iOS';
  
  // Detect browser
  let browser = 'unknown';
  if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  
  return { deviceType, platform, browser };
}

/**
 * Rate limiting (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

// Clean up rate limits every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 60000);
}

