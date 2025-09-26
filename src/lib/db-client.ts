// Database API client for external database server
const DB_API_URL = process.env.DB_API_URL || 'https://linkerdb.up.railway.app'

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

interface User {
  id: string
  username: string
  email?: string
  phone?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  createdAt: string
  updatedAt?: string
}

interface ChatMessage {
  id: string
  content: string
  userId: string
  createdAt: string
  user: {
    id: string
    username: string
    role: string
  }
}

interface Issue {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    role: string
  }
}

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

class DatabaseClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add any existing headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, options.headers)
      }
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Request failed' }
      }

      return { data }
    } catch (error) {
      console.error('Database API request failed:', error)
      return { error: 'Network error' }
    }
  }

  // Auth methods
  async login(username: string, password: string) {
    const response = await this.request<{
      token: string
      user: User
      message: string
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async verifyToken() {
    return this.request<{ user: User }>('/api/auth/verify', {
      method: 'POST',
    })
  }

  // User methods
  async getUsers() {
    return this.request<{ users: User[] }>('/api/users')
  }

  async getUser(id: string) {
    return this.request<{ user: User }>(`/api/users/${id}`)
  }

  async createUser(userData: {
    username: string
    email?: string
    phone?: string
    password: string
    role?: string
  }) {
    return this.request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: { status?: string; role?: string }) {
    return this.request<{ user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  // Chat methods
  async getMessages(limit?: number, before?: string) {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (before) params.append('before', before)

    const query = params.toString()
    return this.request<{
      messages: ChatMessage[]
      hasMore: boolean
    }>(`/api/chat/messages${query ? `?${query}` : ''}`)
  }

  async createMessage(content: string) {
    return this.request<{ message: ChatMessage }>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  // Issue methods
  async getIssues() {
    return this.request<{ issues: Issue[] }>('/api/issues')
  }

  async createIssue(issueData: {
    title: string
    description: string
    priority?: string
  }) {
    return this.request<{ issue: Issue }>('/api/issues', {
      method: 'POST',
      body: JSON.stringify(issueData),
    })
  }

  async updateIssue(id: string, issueData: { status?: string; priority?: string }) {
    return this.request<{ issue: Issue }>(`/api/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(issueData),
    })
  }

  // Proxy methods
  async getProxies() {
    return this.request<{ proxies: ProxyLink[] }>('/api/proxies')
  }

  async createProxy(proxyData: {
    name: string
    url: string
    description?: string
    type?: string
  }) {
    return this.request<{ proxy: ProxyLink }>('/api/proxies', {
      method: 'POST',
      body: JSON.stringify(proxyData),
    })
  }

  async updateProxy(id: string, proxyData: {
    name?: string
    url?: string
    description?: string
    type?: string
    status?: string
  }) {
    return this.request<{ proxy: ProxyLink }>(`/api/proxies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proxyData),
    })
  }

  // Admin methods
  async getStats() {
    return this.request<{
      users: { total: number; pending: number; approved: number }
      messages: { total: number }
      issues: { total: number; open: number; resolved: number }
      proxies: { total: number; active: number }
    }>('/api/admin/stats')
  }
}

// Export singleton instance
export const dbClient = new DatabaseClient(DB_API_URL)
export default dbClient
