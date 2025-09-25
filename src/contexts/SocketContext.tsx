'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

interface TypingUser {
  userId: string
  username: string
  isTyping: boolean
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  messages: ChatMessage[]
  onlineUsers: number
  typingUsers: TypingUser[]
  sendMessage: (content: string) => void
  setTyping: (isTyping: boolean) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  useEffect(() => {
    if (!user || user.status !== 'APPROVED') {
      // Clear socket if user is not authenticated or approved
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
        setMessages([])
        setOnlineUsers(0)
        setTypingUsers([])
      }
      return
    }

    // Initialize socket connection
    const newSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    })

    setSocket(newSocket)

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      
      // Authenticate user with server
      newSocket.emit('authenticate', {
        id: user.id,
        username: user.username,
        role: user.role
      })
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    // Message event handlers
    newSocket.on('newMessage', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('userCount', (count: number) => {
      setOnlineUsers(count)
    })

    newSocket.on('userTyping', (typingData: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== typingData.userId)
        if (typingData.isTyping) {
          return [...filtered, typingData]
        }
        return filtered
      })

      // Clear typing indicator after 3 seconds
      if (typingData.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== typingData.userId))
        }, 3000)
      }
    })

    // Load initial messages from API
    loadInitialMessages()

    return () => {
      newSocket.close()
    }
  }, [user])

  const loadInitialMessages = async () => {
    if (!user || user.status !== 'APPROVED') return
    
    try {
      const response = await fetch('/api/chat/messages?limit=100')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      } else if (response.status === 401) {
        console.log('Not authenticated for chat messages')
      }
    } catch (error) {
      console.error('Failed to load initial messages:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!socket || !content.trim()) return

    try {
      // Save message to database first
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        const data = await response.json()
        // Emit the message with the actual database ID
        socket.emit('sendMessage', {
          content,
          id: data.message.id
        })
      } else {
        throw new Error('Failed to save message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Optionally show error to user
    }
  }

  const setTyping = (isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', isTyping)
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        messages,
        onlineUsers,
        typingUsers,
        sendMessage,
        setTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
