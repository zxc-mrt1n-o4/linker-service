'use client'

import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import ShutdownCountdown from '@/components/ShutdownCountdown'
import { motion } from 'framer-motion'
import { MessageCircle, AlertTriangle, Link2, Users } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <ShutdownCountdown />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Linker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your gateway to the underground school community. Access proxies, 
            chat with members, and stay connected.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href="/chat">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-300">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 ml-4">Global Chat</h3>
                </div>
                <p className="text-gray-600">
                  Connect with community members in real-time. Share information and stay updated.
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/issues">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-300">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 ml-4">Issues Center</h3>
                </div>
                <p className="text-gray-600">
                  Report problems, get help, and track the status of your submitted issues.
                </p>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/proxies">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-300">
                    <Link2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 ml-4">Proxy Links</h3>
                </div>
                <p className="text-gray-600">
                  Access our curated collection of proxy links and third-party resources.
                </p>
              </div>
            </Link>
          </motion.div>

          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-2 lg:col-span-1"
            >
              <Link href="/admin">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-300">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 ml-4">Admin Panel</h3>
                  </div>
                  <p className="text-gray-600">
                    Manage users, approve registrations, and oversee community operations.
                  </p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-50 rounded-xl p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Username</p>
              <p className="font-semibold text-gray-900">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Role</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {user?.status}
              </span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}