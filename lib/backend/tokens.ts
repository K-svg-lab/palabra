/**
 * Token generation and validation utilities
 * For email verification, password reset, etc.
 */

import crypto from 'crypto';
import { prisma } from './db';

// Token expiration times (in milliseconds)
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 character hex string
}

/**
 * Create email verification token
 */
export async function createVerificationToken(
  email: string
): Promise<{ token: string; expires: Date }> {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

  // Delete any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return { token, expires };
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(
  token: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { valid: false, error: 'Token has expired' };
    }

    // Token is valid
    const email = tokenRecord.identifier;

    // Delete token (one-time use)
    await prisma.verificationToken.delete({
      where: { token },
    });

    return { valid: true, email };
  } catch (error) {
    console.error('[Tokens] Error verifying email token:', error);
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Create password reset token
 */
export async function createPasswordResetToken(
  email: string
): Promise<{ token: string; expires: Date }> {
  const token = generateSecureToken();
  const expires = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

  // Delete any existing reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { 
      identifier: `password-reset:${email}`,
    },
  });

  // Create new token (prefix identifier to distinguish from email verification)
  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${email}`,
      token,
      expires,
    },
  });

  return { token, expires };
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    // Check if this is a password reset token
    if (!tokenRecord.identifier.startsWith('password-reset:')) {
      return { valid: false, error: 'Invalid token type' };
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { valid: false, error: 'Token has expired. Please request a new password reset link.' };
    }

    // Token is valid - extract email
    const email = tokenRecord.identifier.replace('password-reset:', '');

    // Delete token (one-time use)
    await prisma.verificationToken.delete({
      where: { token },
    });

    return { valid: true, email };
  } catch (error) {
    console.error('[Tokens] Error verifying password reset token:', error);
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Clean up expired tokens (called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    
    if (result.count > 0) {
      console.log(`[Tokens] Cleaned up ${result.count} expired tokens`);
    }
    
    return result.count;
  } catch (error) {
    console.error('[Tokens] Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Check rate limiting for token requests
 * Prevents abuse by limiting token generation per email
 */
const tokenRequestsMap = new Map<string, { count: number; resetAt: number }>();

export function checkTokenRateLimit(
  email: string,
  maxRequests: number = 3,
  windowMs: number = 3600000 // 1 hour
): boolean {
  const now = Date.now();
  const record = tokenRequestsMap.get(email);

  if (!record || now > record.resetAt) {
    // First request or window expired
    tokenRequestsMap.set(email, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment counter
  record.count++;
  return true;
}

/**
 * Clean up rate limit map (called periodically)
 */
export function cleanupTokenRateLimits(): void {
  const now = Date.now();
  for (const [email, record] of tokenRequestsMap.entries()) {
    if (now > record.resetAt) {
      tokenRequestsMap.delete(email);
    }
  }
}

// Clean up expired tokens every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredTokens();
    cleanupTokenRateLimits();
  }, 3600000); // 1 hour
}
