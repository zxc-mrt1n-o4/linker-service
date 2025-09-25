'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  MessageCircle, 
  AlertTriangle, 
  Link2, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react'

export default function Navigation() {
  const { user, logout } = useAuth()
  const { isConnected, onlineUsers } = useSocket()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Settings },
    { href: '/chat', label: 'Global Chat', icon: MessageCircle },
    { href: '/issues', label: 'Issues Center', icon: AlertTriangle },
    { href: '/proxies', label: 'Proxy Links', icon: Link2 },
    ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' 
      ? [{ href: '/admin', label: 'Admin Panel', icon: Users }] 
      : [])
  ]

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Linker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.href === '/chat' && (
                    <div className="flex items-center space-x-1">
                      {isConnected ? (
                        <Wifi className="w-3 h-3 text-green-600" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-red-600" />
                      )}
                      {onlineUsers > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          {onlineUsers}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user?.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-100 shadow-md"
        >
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between text-gray-700 hover:text-black transition-colors duration-200 py-2"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.href === '/chat' && (
                    <div className="flex items-center space-x-1">
                      {isConnected ? (
                        <Wifi className="w-4 h-4 text-green-600" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-600" />
                      )}
                      {onlineUsers > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                          {onlineUsers}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
            <div className="border-t border-gray-200 pt-3">
              <div className="text-sm text-gray-600 mb-2">
                Welcome, <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={() => {
                  logout()
                  setIsMenuOpen(false)
                }}
                className="flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors duration-200 py-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}
