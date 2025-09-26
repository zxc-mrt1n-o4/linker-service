'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  AlertTriangle, 
  Link2, 
  MessageCircle,
  UserCheck,
  UserX,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  X,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  username: string
  email?: string
  phone?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
  _count: {
    chatMessages: number
    issues: number
  }
}

interface Stats {
  users: {
    total: number
    pending: number
    approved: number
  }
  issues: {
    total: number
    open: number
    resolved: number
  }
  proxies: {
    total: number
    active: number
  }
  chat: {
    totalMessages: number
  }
}

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pending'>('overview')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pendingUpdates, setPendingUpdates] = useState<{[key: string]: {field: string, value: string, originalValue: string}}>({})
  const [updateErrors, setUpdateErrors] = useState<{[key: string]: string}>({})
  const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({})
  const toastTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({})
  
  // Clear any error messages after 5 seconds
  useEffect(() => {
    return () => {
      // Clean up any timeouts when component unmounts
      Object.values(toastTimeoutRef.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return
    }
    loadData()
  }, [user, statusFilter, roleFilter])

  const loadData = async () => {
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/users?${new URLSearchParams({ 
          status: statusFilter, 
          role: roleFilter 
        })}`)
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to clear errors after a timeout
  const clearErrorAfterTimeout = (key: string) => {
    if (toastTimeoutRef.current[key]) {
      clearTimeout(toastTimeoutRef.current[key])
    }
    
    toastTimeoutRef.current[key] = setTimeout(() => {
      setUpdateErrors(prev => {
        const newErrors = {...prev}
        delete newErrors[key]
        return newErrors
      })
    }, 5000)
  }

  const updateUserStatus = async (userId: string, newStatus: string, originalStatus: string) => {
    // Create a unique key for this update
    const updateKey = `status-${userId}`
    
    // Clear any existing errors for this user
    setUpdateErrors(prev => {
      const newErrors = {...prev}
      delete newErrors[updateKey]
      return newErrors
    })
    
    // Set updating flag
    setIsUpdating(prev => ({...prev, [updateKey]: true}))
    
    // Optimistically update the UI
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId ? {...u, status: newStatus as any} : u
      )
    )
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // If the update failed, revert the optimistic update
        const data = await response.json()
        const errorMessage = data.error || 'Failed to update user status'
        
        // Revert the optimistic update
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId ? {...u, status: originalStatus as any} : u
          )
        )
        
        // Show error message
        setUpdateErrors(prev => ({...prev, [updateKey]: errorMessage}))
        clearErrorAfterTimeout(updateKey)
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
      
      // Revert the optimistic update
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? {...u, status: originalStatus as any} : u
        )
      )
      
      // Show error message
      setUpdateErrors(prev => ({...prev, [updateKey]: 'Network error occurred'}))
      clearErrorAfterTimeout(updateKey)
    } finally {
      // Clear updating flag
      setIsUpdating(prev => {
        const newUpdating = {...prev}
        delete newUpdating[updateKey]
        return newUpdating
      })
    }
  }

  const updateUserRole = async (userId: string, newRole: string, originalRole: string) => {
    // Create a unique key for this update
    const updateKey = `role-${userId}`
    
    // Clear any existing errors for this user
    setUpdateErrors(prev => {
      const newErrors = {...prev}
      delete newErrors[updateKey]
      return newErrors
    })
    
    // Set updating flag
    setIsUpdating(prev => ({...prev, [updateKey]: true}))
    
    // Optimistically update the UI
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId ? {...u, role: newRole as any} : u
      )
    )
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        // If the update failed, revert the optimistic update
        const data = await response.json()
        const errorMessage = data.error || 'Failed to update user role'
        
        // Revert the optimistic update
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId ? {...u, role: originalRole as any} : u
          )
        )
        
        // Show error message
        setUpdateErrors(prev => ({...prev, [updateKey]: errorMessage}))
        clearErrorAfterTimeout(updateKey)
      }
    } catch (error) {
      console.error('Failed to update user role:', error)
      
      // Revert the optimistic update
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? {...u, role: originalRole as any} : u
        )
      )
      
      // Show error message
      setUpdateErrors(prev => ({...prev, [updateKey]: 'Network error occurred'}))
      clearErrorAfterTimeout(updateKey)
    } finally {
      // Clear updating flag
      setIsUpdating(prev => {
        const newUpdating = {...prev}
        delete newUpdating[updateKey]
        return newUpdating
      })
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING')

  // Toast component for error notifications
  const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2"
    >
      <span>{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-red-600 rounded-full">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
  
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Error Toasts */}
      <AnimatePresence>
        {Object.entries(updateErrors).map(([key, message]) => (
          <Toast 
            key={key} 
            message={message} 
            onClose={() => {
              setUpdateErrors(prev => {
                const newErrors = {...prev}
                delete newErrors[key]
                return newErrors
              })
            }} 
          />
        ))}
      </AnimatePresence>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">Manage users, monitor activity, and oversee the platform</p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">{user.role}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-1 mb-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'All Users', icon: Users },
              { id: 'pending', label: `Pending (${pendingUsers.length})`, icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.users.total}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.users.pending}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Issues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.issues.total}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chat Messages</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.chat.totalMessages}
                    </p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Status Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Approved</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {stats.users.approved}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {stats.users.pending}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Status Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Open</span>
                    <span className="text-gray-900 font-medium">{stats.issues.open}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Resolved</span>
                    <span className="text-gray-900 font-medium">{stats.issues.resolved}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm custom-select select-focus-animation dropdown-animate-in"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm custom-select select-focus-animation dropdown-animate-in"
              >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {/* Users List */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {users.map((userData) => (
                      <tr key={userData.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{userData.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>{userData.phone}</div>
                          {userData.email && <div className="text-gray-400">{userData.email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userData.role === 'SUPER_ADMIN' ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userData.role)}`}>
                              {userData.role}
                            </span>
                          ) : (
                            <div className="relative">
                              <select
                                value={userData.role}
                                onChange={(e) => updateUserRole(userData.id, e.target.value, userData.role)}
                                disabled={user?.role !== 'SUPER_ADMIN' || userData.id === user?.id || isUpdating[`role-${userData.id}`]}
                                className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getRoleColor(userData.role)} focus:ring-2 focus:ring-black custom-select select-focus-animation dropdown-animate-in`}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                              {isUpdating[`role-${userData.id}`] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                                  <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <select
                              value={userData.status}
                              onChange={(e) => updateUserStatus(userData.id, e.target.value, userData.status)}
                              disabled={userData.id === user?.id || userData.role === 'SUPER_ADMIN' || isUpdating[`status-${userData.id}`]}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(userData.status)} focus:ring-2 focus:ring-black custom-select select-focus-animation dropdown-animate-in`}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="REJECTED">REJECTED</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                            {isUpdating[`status-${userData.id}`] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>{userData._count.chatMessages} messages</div>
                          <div>{userData._count.issues} issues</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(new Date(userData.createdAt))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {userData.role !== 'SUPER_ADMIN' && (
                              <motion.button
                                onClick={() => deleteUser(userData.id)}
                                className="text-red-600 hover:text-red-700 p-1 rounded transition-colors duration-200"
                                title="Delete User"
                                disabled={userData.id === user?.id}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending user registrations</p>
              </div>
            ) : (
              pendingUsers.map((userData, index) => (
                <motion.div
                  key={userData.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{userData.username}</h3>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          Pending Approval
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Phone:</strong> {userData.phone}</p>
                        {userData.email && <p><strong>Email:</strong> {userData.email}</p>}
                        <p><strong>Registered:</strong> {formatDate(new Date(userData.createdAt))}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <motion.button
                        onClick={() => updateUserStatus(userData.id, 'APPROVED', userData.status)}
                        disabled={isUpdating[`status-${userData.id}`]}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {isUpdating[`status-${userData.id}`] && userData.status !== 'APPROVED' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Approve</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => updateUserStatus(userData.id, 'REJECTED', userData.status)}
                        disabled={isUpdating[`status-${userData.id}`]}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {isUpdating[`status-${userData.id}`] && userData.status !== 'REJECTED' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Reject</span>
                      </motion.button>
                      
                      {userData.role !== 'SUPER_ADMIN' && (
                        <motion.button
                          onClick={() => deleteUser(userData.id)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
