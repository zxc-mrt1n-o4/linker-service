'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ShutdownCountdown from '@/components/ShutdownCountdown'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  remainingAttempts?: number;
  retryAfter?: number;
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ErrorState | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
  
  const { login } = useAuth()
  const router = useRouter()

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial check
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Countdown timer for rate limiting
  useEffect(() => {
    if (!retryCountdown) return
    
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer)
          return null
        }
        return prev ? prev - 1 : null
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [retryCountdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!username.trim()) {
      setError({
        message: 'Username is required',
        type: 'error'
      })
      return
    }
    
    if (!password) {
      setError({
        message: 'Password is required',
        type: 'error'
      })
      return
    }
    
    // Network check
    if (!isOnline) {
      setError({
        message: 'You appear to be offline. Please check your connection.',
        type: 'warning'
      })
      return
    }
    
    setError(null)
    setLoading(true)

    try {
      const result = await login(username, password)
      
      if (result.success) {
        router.push('/')
      } else {
        // Handle different error types
        if (result.retryAfter) {
          // Rate limiting
          setRetryCountdown(result.retryAfter)
          setError({
            message: `${result.error}. Please try again later.`,
            type: 'warning',
            retryAfter: result.retryAfter
          })
        } else if (result.remainingAttempts !== undefined) {
          // Invalid credentials with remaining attempts
          setError({
            message: `${result.error}. Remaining attempts: ${result.remainingAttempts}`,
            type: 'error',
            remainingAttempts: result.remainingAttempts
          })
        } else if (result.isNetworkError) {
          // Network error
          setError({
            message: result.error || 'Network error occurred',
            type: 'warning'
          })
        } else {
          // Generic error
          setError({
            message: result.error || 'Login failed',
            type: 'error'
          })
        }
      }
    } catch (err) {
      setError({
        message: 'An unexpected error occurred',
        type: 'error'
      })
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <ShutdownCountdown />
      <div className="flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-50 rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100"
        >
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Welcome to Linker
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600"
          >
            Sign in to access the underground community
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white"
              required
            />
          </motion.div>

          {/* Enhanced error display with different types and additional information */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`border rounded-xl p-4 ${
                error.type === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : error.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <p className="text-sm font-medium">{error.message}</p>
              
              {/* Show countdown timer for rate limiting */}
              {retryCountdown && (
                <p className="text-xs mt-1">
                  You can try again in {retryCountdown} seconds
                </p>
              )}
              
              {/* Network status indicator */}
              {!isOnline && (
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <p className="text-xs">You are currently offline</p>
                </div>
              )}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            type="submit"
            disabled={loading || !!retryCountdown || !isOnline}
            className="w-full bg-black text-white py-3 px-4 rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : retryCountdown ? (
              <div className="flex items-center justify-center">
                <span>Try again in {retryCountdown}s</span>
              </div>
            ) : !isOnline ? (
              <div className="flex items-center justify-center">
                <span>Offline</span>
              </div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-black font-medium hover:underline">
              Register here
            </Link>
          </p>
        </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
