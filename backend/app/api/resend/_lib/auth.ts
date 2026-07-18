import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '../../_lib/supabase';

/**
 * Extract and validate Supabase Auth JWT from request.
 * Returns the authenticated user ID or null if invalid.
 */
export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseServiceClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('JWT validation failed:', error?.message);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Error validating JWT:', error);
    return null;
  }
}

/**
 * Extract JWT token from request
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware helper to ensure authenticated request
 */
export async function requireAuth(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { userId };
}

/**
 * Extract client IP address for audit logging
 */
export function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const real = req.headers.get('x-real-ip');
  if (real) {
    return real;
  }
  return null;
}
