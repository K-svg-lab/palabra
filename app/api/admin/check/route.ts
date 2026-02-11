/**
 * Admin Access Check API
 * 
 * Verifies if the authenticated user has admin access.
 * Uses server-side environment variables for secure admin email comparison.
 * 
 * @module app/api/admin/check
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/backend/api-utils';
import { prisma } from '@/lib/backend/db';

export async function GET() {
  try {
    // Verify authentication
    const authResult = await requireAuth();
    if (authResult instanceof Response) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const { userId } = authResult;

    // Get admin email from environment (server-side only)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.error('[Admin Check] ADMIN_EMAIL environment variable not set');
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 403 });
    }

    // Case-insensitive email comparison with whitespace trimming
    const isAdmin = user.email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    return NextResponse.json({ 
      isAdmin,
      userId: isAdmin ? userId : undefined,
    });

  } catch (error) {
    console.error('[Admin Check] Error:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
