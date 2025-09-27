'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import { motion } from 'framer-motion'
import { 
  Link2, 
  Star, 
  Globe, 
  Plus, 
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { openInAboutBlank } from '@/lib/aboutBlank'

interface ProxyLink {
  id: string
  name: string
  url: string
  description?: string
  type: 'FANCY' | 'THIRD_PARTY'
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW'
  createdAt: string
  updatedAt: string
}

export default function ProxiesPage() {
  const { user } = useAuth()
  const [proxies, setProxies] = useState<ProxyLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedType, setSelectedType] = useState<'ALL' | 'FANCY' | 'THIRD_PARTY'>('ALL')
  const [newProxy, setNewProxy] = useState({
    name: '',
    url: '',
    description: '',
    type: 'THIRD_PARTY'
  })

  useEffect(() => {
    loadProxies()
  }, [selectedType])

  const loadProxies = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'ALL') params.append('type', selectedType)
      
      const response = await fetch(`/api/proxies?${params}`, {
        credentials: 'include', // ✅ add this
      })
      if (response.ok) {
        const data = await response.json()
        setProxies(data.proxies)
      }
    } catch (error) {
      console.error('Failed to load proxies:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProxy = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProxy.name.trim() || !newProxy.url.trim()) return

    try {
      const response = await fetch('/api/proxies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProxy),
        credentials: 'include', // ✅ add this
      })

      if (response.ok) {
        setNewProxy({ name: '', url: '', description: '', type: 'THIRD_PARTY' })
        setShowCreateForm(false)
        loadProxies()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create proxy')
      }
    } catch (error) {
      console.error('Failed to create proxy:', error)
      alert('Failed to create proxy')
    }
  }

  const deleteProxy = async (proxyId: string) => {
    if (!confirm('Are you sure you want to delete this proxy?')) return

    try {
      const response = await fetch(`/api/proxies/${proxyId}`, {
        method: 'DELETE',
        credentials: 'include', // ✅ add this
      })

      if (response.ok) {
        loadProxies()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete proxy')
      }
    } catch (error) {
      console.error('Failed to delete proxy:', error)
      alert('Failed to delete proxy')
    }
  }

  const toggleProxyStatus = async (proxyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    
    try {
      const response = await fetch(`/api/proxies/${proxyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include', // ✅ add this
      })

      if (response.ok) {
        loadProxies()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update proxy')
      }
    } catch (error) {
      console.error('Failed to update proxy:', error)
      alert('Failed to update proxy')
    }
  }

  const fancyProxies = proxies.filter(p => p.type === 'FANCY')
  const thirdPartyProxies = proxies.filter(p => p.type === 'THIRD_PARTY')

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Proxy Links</h1>
              <p className="text-gray-600">Access our curated collection of proxy services</p>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-black text-white px-6 py-3 rounded-2xl hover:bg-gray-800 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Proxy</span>
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-1">
              {(['ALL', 'FANCY', 'THIRD_PARTY'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    selectedType === type
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'ALL' ? 'All' : type === 'FANCY' ? 'Our Proxies' : 'Third Party'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Create Proxy Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}
          >
            <div className="bg-white rounded-3xl p-8 w-full max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Proxy</h2>
              <form onSubmit={createProxy} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newProxy.name}
                    onChange={(e) => setNewProxy({ ...newProxy, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={newProxy.url}
                    onChange={(e) => setNewProxy({ ...newProxy, url: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProxy.description}
                    onChange={(e) => setNewProxy({ ...newProxy, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newProxy.type}
                    onChange={(e) => setNewProxy({ ...newProxy, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  >
                    <option value="FANCY">Our Proxy (Fancy)</option>
                    <option value="THIRD_PARTY">Third Party</option>
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white py-3 rounded-2xl hover:bg-gray-800 transition-all duration-200"
                  >
                    Add Proxy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-2xl hover:bg-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Fancy Proxies Section */}
        {(selectedType === 'ALL' || selectedType === 'FANCY') && fancyProxies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Premium Proxies</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fancyProxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200/50 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{proxy.name}</h3>
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => toggleProxyStatus(proxy.id, proxy.status)}
                          className="p-1 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                        >
                          {proxy.status === 'ACTIVE' ? (
                            <Eye className="w-4 h-4 text-purple-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteProxy(proxy.id)}
                          className="p-1 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {proxy.description && (
                    <p className="text-gray-600 mb-4 text-sm">{proxy.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openInAboutBlank(proxy.url)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 text-sm"
                      >
                        <span>Open in ab:blank</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <a
                        href={proxy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-300 transition-all duration-200 flex items-center text-sm"
                      >
                        <span>Direct</span>
                      </a>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      proxy.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {proxy.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Third Party Proxies Section */}
        {(selectedType === 'ALL' || selectedType === 'THIRD_PARTY') && thirdPartyProxies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Third Party Proxies</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {thirdPartyProxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{proxy.name}</h3>
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => toggleProxyStatus(proxy.id, proxy.status)}
                          className="p-1 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                        >
                          {proxy.status === 'ACTIVE' ? (
                            <Eye className="w-4 h-4 text-purple-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteProxy(proxy.id)}
                          className="p-1 hover:bg-red-100 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {proxy.description && (
                    <p className="text-gray-600 mb-4 text-sm">{proxy.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openInAboutBlank(proxy.url)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 text-sm"
                      >
                        <span>Open in ab:blank</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <a
                        href={proxy.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-300 transition-all duration-200 flex items-center text-sm"
                      >
                        <span>Direct</span>
                      </a>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      proxy.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {proxy.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        {/* Empty State */}
        {proxies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50"
          >
            <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No proxy links available yet.</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
