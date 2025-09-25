'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import Navigation from '@/components/Navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Users, Wifi, WifiOff, Loader, AlertCircle } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { applyShakeAnimation } from '@/lib/animations'

export default function ChatPage() {
  const { user } = useAuth()
  const { 
    isConnected, 
    messages, 
    onlineUsers, 
    typingUsers, 
    sendMessage, 
    setTyping 
  } = useSocket()
  
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>(
    isConnected ? 'connected' : 'connecting'
  )
  
  const inputRef = useRef<HTMLInputElement>(null)
  const inputContainerRef = useRef<HTMLFormElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sendErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Effect to maintain input focus
  useEffect(() => {
    // Focus the input when the component mounts
    inputRef.current?.focus()
    
    // Focus the input whenever connection status changes
    if (isConnected) {
      inputRef.current?.focus()
    }
    
    // Update connection status
    if (isConnected) {
      setConnectionStatus('connected')
    } else if (connectionStatus === 'connected') {
      setConnectionStatus('reconnecting')
    } else if (connectionStatus === 'connecting' && !isConnected) {
      setConnectionStatus('disconnected')
    }
  }, [isConnected, connectionStatus])
  
  // Additional effect to ensure input stays focused, especially on mobile
  useEffect(() => {
    // Function to handle focus
    const keepFocused = () => {
      // Check if we're on a mobile device
      if (window.innerWidth < 768) {
        // Only focus if the document is active and the input isn't already focused
        if (document.activeElement !== inputRef.current && document.hasFocus()) {
          inputRef.current?.focus()
        }
      }
    }
    
    // Set up an interval to periodically check focus
    const focusInterval = setInterval(keepFocused, 300)
    
    // Set up event listeners for mobile-specific events
    window.addEventListener('touchend', keepFocused)
    window.addEventListener('resize', keepFocused)
    
    // Clean up
    return () => {
      clearInterval(focusInterval)
      window.removeEventListener('touchend', keepFocused)
      window.removeEventListener('resize', keepFocused)
    }
  }, [])
  
  // Clear error message after a delay
  useEffect(() => {
    if (sendError) {
      if (sendErrorTimeoutRef.current) {
        clearTimeout(sendErrorTimeoutRef.current)
      }
      
      sendErrorTimeoutRef.current = setTimeout(() => {
        setSendError(null)
      }, 5000) // Clear error after 5 seconds
      
      return () => {
        if (sendErrorTimeoutRef.current) {
          clearTimeout(sendErrorTimeoutRef.current)
        }
      }
    }
  }, [sendError])

  const handleTyping = (value: string) => {
    setNewMessage(value)

    if (!isTyping && value.length > 0) {
      setIsTyping(true)
      setTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        setTyping(false)
      }
    }, 1000)
  }

  // Enhanced sendMessageNow function with better mobile focus handling
  const sendMessageNow = async () => {
    // Store current message text to avoid race conditions
    const messageText = newMessage.trim();
    
    if (!messageText || sending) return;
    
    // If not connected, show error and shake input
    if (!isConnected) {
      setSendError('Cannot send message while disconnected');
      applyShakeAnimation(inputContainerRef.current);
      // Ensure input stays focused
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
  
    // Set sending state
    setSending(true);
    
    // Clear any previous errors
    setSendError(null);
  
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      setTyping(false);
    }
    
    // Clear the input immediately to improve perceived performance
    // This helps prevent the mobile keyboard from disappearing
    setNewMessage("");
    
    // Make sure input stays focused after clearing
    inputRef.current?.focus();
  
    try {
      // Send the message with the stored text
      await sendMessage(messageText);
      
      // Keep input focused after successful send
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError('Failed to send message. Please try again.');
      applyShakeAnimation(inputContainerRef.current);
      
      // If send fails, restore the message text
      setNewMessage(messageText);
    } finally {
      setSending(false);
      
      // Use multiple techniques to ensure focus is maintained
      // This is especially important for mobile browsers
      setTimeout(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus();
        }
      }, 50);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'text-red-600'
      case 'ADMIN': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Chat</h1>
              <p className="text-gray-600">Connect with the community in real-time</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' && (
                  <>
                    <Wifi className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                )}
                {connectionStatus === 'connecting' && (
                  <>
                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-600">Connecting</span>
                  </>
                )}
                {connectionStatus === 'reconnecting' && (
                  <>
                    <Loader className="w-5 h-5 text-amber-600 animate-spin" />
                    <span className="text-sm text-amber-600">Reconnecting</span>
                  </>
                )}
                {connectionStatus === 'disconnected' && (
                  <>
                    <WifiOff className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-600">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* Online Users Count */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span className="text-sm">{onlineUsers} online</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 bg-gray-50 rounded-xl border border-gray-100 flex flex-col overflow-hidden shadow-sm"
        >
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            {/* Connection status messages in chat area */}
            {connectionStatus === 'connecting' && (
              <div className="text-center text-blue-600 py-4 bg-white rounded-xl border border-gray-100">
                <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Connecting to chat server...</p>
              </div>
            )}
            
            {connectionStatus === 'reconnecting' && (
              <div className="text-center text-amber-600 py-4 bg-white rounded-xl border border-amber-100">
                <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Reconnecting to chat server...</p>
              </div>
            )}
            
            {connectionStatus === 'disconnected' && (
              <div className="text-center text-red-600 py-4 bg-white rounded-xl border border-red-100">
                <WifiOff className="w-6 h-6 mx-auto mb-2" />
                <p>Disconnected from chat server</p>
                <p className="text-xs mt-1">You can still type your message. It will send when reconnected.</p>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p>No messages yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${message.user.id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                      <div className={`max-w-xs lg:max-w-md ${
                        message.user.id === user?.id 
                         ? 'bg-black text-white' 
                         : 'bg-white text-gray-900 border border-gray-100'
                      } rounded-xl px-4 py-3 shadow-sm`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-medium ${
                          message.user.id === user?.id 
                            ? 'text-gray-200' 
                            : getRoleColor(message.user.role)
                        }`}>
                          {message.user.username}
                        </span>
                        {(message.user.role === 'ADMIN' || message.user.role === 'SUPER_ADMIN') && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadge(message.user.role)}`}>
                            {message.user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                          </span>
                        )}
                        <span className={`text-xs ${
                          message.user.id === user?.id 
                            ? 'text-gray-300' 
                            : 'text-gray-500'
                        }`}>
                          {formatTime(new Date(message.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Typing Indicators */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                   <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-100 p-4">
            <form 
              ref={inputContainerRef}
              className="flex space-x-3 relative"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessageNow();
                // Immediately refocus the input to keep the keyboard open on mobile
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 0);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessageNow();
                  }
                }}
                onBlur={(e) => {
                  // Prevent the input from losing focus on mobile
                  if (window.innerWidth < 768) {
                    // Small delay to allow other events to process
                    setTimeout(() => {
                      e.target.focus();
                    }, 10);
                  }
                }}
                placeholder={
                  connectionStatus === 'connected' 
                    ? "Type your message..." 
                    : connectionStatus === 'reconnecting'
                      ? "Reconnecting..." 
                      : connectionStatus === 'disconnected'
                        ? "Disconnected..."
                        : "Connecting..."
                }
                className={`flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 bg-white mobile-input-focus
                  ${sendError ? 'border-red-300' : 'border-gray-200'}`}
                maxLength={1000}
                // Never disable the input to maintain focus
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                onMouseDown={(e) => {
                  // Prevent the button from stealing focus
                  e.preventDefault();
                }}
                onTouchStart={(e) => {
                  // For touch devices, prevent default behavior
                  if (!newMessage.trim() || sending) {
                    e.preventDefault();
                  }
                }}
              >
                {sending ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>

            {/* Status and error messages */}
            <AnimatePresence>
              {sendError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center mt-2 text-red-600 text-xs"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>{sendError}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {connectionStatus === 'reconnecting' && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                Connection lost. Attempting to reconnect...
              </p>
            )}
            
            {connectionStatus === 'disconnected' && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Connection failed. Please check your internet connection.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}