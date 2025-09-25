'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  Trash2,
  Edit
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Issue {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
  }
}

export default function IssuesPage() {
  const { user } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM'
  })

  // Load issues when component mounts or when filter changes
  useEffect(() => {
    setLoading(true)
    loadIssues()
  }, [statusFilter])

  const loadIssues = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/issues?${params}`)
      if (response.ok) {
        const data = await response.json()
        setIssues(data.issues)
      }
    } catch (error) {
      console.error('Failed to load issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const createIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newIssue.title.trim() || !newIssue.description.trim()) return

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIssue),
      })

      if (response.ok) {
        setNewIssue({ title: '', description: '', priority: 'MEDIUM' })
        setShowCreateForm(false)
        loadIssues()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create issue')
      }
    } catch (error) {
      console.error('Failed to create issue:', error)
      alert('Failed to create issue')
    }
  }

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadIssues()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update issue')
      }
    } catch (error) {
      console.error('Failed to update issue:', error)
      alert('Failed to update issue')
    }
  }

  const deleteIssue = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return

    // Optimistically remove the issue from the UI first
    setIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId))

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to delete issue')
        // If deletion fails, reload issues to restore the state
        loadIssues()
      }
    } catch (error) {
      console.error('Failed to delete issue:', error)
      alert('Failed to delete issue')
      // If deletion fails, reload issues to restore the state
      loadIssues()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'RESOLVED': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CLOSED': return <XCircle className="w-5 h-5 text-gray-500" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Render the page layout regardless of loading state
  // We'll show a loading indicator in the issues list area

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Issues Center</h1>
              <p className="text-gray-600">Report problems and track their resolution</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-black text-white px-6 py-3 rounded-2xl hover:bg-gray-800 transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Issue</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Filter by status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm custom-select select-focus-animation dropdown-animate-in"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </motion.div>

        {/* Create Issue Form */}
        <AnimatePresence>
          {showCreateForm && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-3xl p-8 w-full max-w-2xl"
              >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Issue</h2>
              <form onSubmit={createIssue} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 h-32 resize-none"
                    required
                    maxLength={2000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 custom-select select-focus-animation"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="flex space-x-4">
                  <motion.button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-2xl hover:bg-gray-800 transition-all duration-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Create Issue
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-2xl hover:bg-gray-300 transition-all duration-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Issues List */}
        <div className="space-y-4">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50"
            >
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
              </div>
              <p className="text-gray-600">Loading issues...</p>
            </motion.div>
          ) : issues.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50"
            >
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No issues found. Create your first issue to get started!</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {issues.map((issue) => (
                 <motion.div
                   key={issue.id}
                   // No initial animation - cards appear immediately
                   // Only animate when removing
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.2 }}
                   className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300"
                 >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(issue.status)}
                      <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{issue.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>By {issue.user.username}</span>
                      <span>Created {formatDate(new Date(issue.createdAt))}</span>
                      {issue.updatedAt !== issue.createdAt && (
                        <span>Updated {formatDate(new Date(issue.updatedAt))}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <div className="relative">
                        <select
                          value={issue.status}
                          onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                          className="px-3 py-1 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-sm custom-select select-focus-animation dropdown-animate-in"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    )}
                    {(issue.user.id === user?.id || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <motion.button
                        onClick={() => deleteIssue(issue.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}
