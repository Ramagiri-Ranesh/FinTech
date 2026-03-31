import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { checkRateLimit, sanitizeQuery } from './security';

/**
 * Middleware to validate API requests
 */
export async function validateAPIRequest(req: NextRequest) {
  // Check rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip, 100, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Validate session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null; // Request is valid
}

/**
 * Sanitize request body
 */
export function sanitizeRequestBody(body: any): any {
  return sanitizeQuery(body);
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  return response;
}

/**
 * Validate request method
 */
export function validateMethod(req: NextRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(req.method);
}

/**
 * Validate content type
 */
export function validateContentType(req: NextRequest, expectedType: string): boolean {
  const contentType = req.headers.get('content-type');
  return contentType?.includes(expectedType) || false;
}
