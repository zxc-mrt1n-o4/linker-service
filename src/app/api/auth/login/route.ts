import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db-client'
import { sanitizeString, validateUsername, validatePassword } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit'

// Enhanced login route with security features
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { username: rawUsername, password } = body;
    
    // Basic validation
    if (!rawUsername || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Sanitize and validate username
    const username = sanitizeString(rawUsername);
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.message || 'Invalid username format' },
        { status: 400 }
      );
    }
    
    // Check rate limiting before database query
    const rateLimit = checkRateLimit(ip, username);
    if (rateLimit.limited) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Use external database API for login
    const loginResponse = await dbClient.login(username, password);
    
    if (loginResponse.error) {
      return NextResponse.json(
        { 
          error: loginResponse.error,
          remainingAttempts: rateLimit.remainingAttempts
        },
        { status: 401 }
      );
    }
    
    if (!loginResponse.data) {
      return NextResponse.json({ error: 'No data received' }, { status: 500 });
    }
    
    // Reset rate limit on successful login
    resetRateLimit(ip, username);
    
    const { token, user } = loginResponse.data;
    
    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
    
    // Set HTTP-only cookie with improved security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' to 'strict' for better CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    // Set security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
