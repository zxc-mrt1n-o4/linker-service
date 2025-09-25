'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  username: string
  email?: string
  phone?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  createdAt: string
}

interface LoginResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
  remainingAttempts?: number;
  isNetworkError?: boolean;
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string, maxRetries?: number) => Promise<LoginResult>
  logout: () => Promise<void>
  register: (data: {
    username: string
    password: string
    phone: string
    email?: string
  }) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setUser(data.user)
        } else {
          console.error('Auth check: Non-JSON response')
        }
      } else if (response.status === 401) {
        // Not authenticated, clear any existing user state
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced login function with retry logic and better error handling
  const login = async (username: string, password: string, maxRetries = 2) => {
    let retries = 0;
    let lastError = null;
    
    // Retry loop for network resilience
    while (retries <= maxRetries) {
      try {
        // Add a small delay before retries
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          credentials: 'include', // Important for cookies
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Check for rate limiting
        if (response.status === 429) {
          const data = await response.json();
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
          return { 
            success: false, 
            error: data.error || 'Too many login attempts',
            retryAfter
          };
        }
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          
          // If this is not the last retry, continue to next attempt
          if (retries < maxRetries) {
            retries++;
            lastError = 'Server returned invalid response';
            continue;
          }
          
          return { success: false, error: 'Server returned invalid response' };
        }
        
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.user);
          return { success: true };
        } else {
          // Don't retry on authentication failures - these are definitive
          if (response.status === 401 || response.status === 403) {
            return { 
              success: false, 
              error: data.error || 'Login failed',
              remainingAttempts: data.remainingAttempts
            };
          }
          
          // For other errors, retry if we haven't reached max retries
          if (retries < maxRetries) {
            retries++;
            lastError = data.error || 'Login failed';
            continue;
          }
          
          return { success: false, error: data.error || 'Login failed' };
        }
      } catch (error) {
        // Handle network errors and timeouts
        console.error('Login attempt error:', error);
        
        // If this is an abort error (timeout), provide a specific message
        const isTimeout = error instanceof DOMException && error.name === 'AbortError';
        const errorMessage = isTimeout 
          ? 'Request timed out. Please check your connection.' 
          : error instanceof Error ? error.message : 'Network error occurred';
        
        // If we haven't reached max retries, try again
        if (retries < maxRetries) {
          retries++;
          lastError = errorMessage;
          continue;
        }
        
        return { 
          success: false, 
          error: errorMessage,
          isNetworkError: true
        };
      }
    }
    
    // This should never be reached due to the returns in the loop,
    // but TypeScript needs it for type safety
    return { 
      success: false, 
      error: lastError || 'Unknown error occurred'
    };
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const register = async (data: {
    username: string
    password: string
    phone: string
    email?: string
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
