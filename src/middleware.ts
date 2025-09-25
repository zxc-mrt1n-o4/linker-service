import { NextRequest, NextResponse } from 'next/server'

// Define routes that don't require authentication
const publicRoutes = ['/login', '/register']
const publicApiRoutes = ['/api/auth/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all API auth routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow public pages
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // For all other routes, check if user has auth token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, allow access (simplified - no token validation in middleware)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}