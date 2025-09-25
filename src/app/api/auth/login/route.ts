import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
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
    
    // Find user - use a constant time query to prevent timing attacks
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    // Always verify a password hash even if user doesn't exist (to prevent timing attacks)
    const dummyHash = '$2a$12$K8GpVH3XlZfOoGjpU/x1r.8VKeztLrT1oWGYVy1uuO2GjYqQgXKLG';
    const passwordToVerify = user?.password || dummyHash;
    const isValidPassword = await verifyPassword(password, passwordToVerify);
    
    // Handle authentication failure
    if (!user || !isValidPassword) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          remainingAttempts: rateLimit.remainingAttempts
        },
        { status: 401 }
      );
    }
    
    // Check if user is approved
    if (user.status !== 'APPROVED') {
      let message = 'Account not approved yet';
      if (user.status === 'REJECTED') message = 'Account has been rejected';
      if (user.status === 'SUSPENDED') message = 'Account has been suspended';
      
      return NextResponse.json(
        { error: message },
        { status: 403 }
      );
    }
    
    // Reset rate limit on successful login
    resetRateLimit(ip, username);
    
    // Generate token
    const token = generateToken(user.id);
    
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
