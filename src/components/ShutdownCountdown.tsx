'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export default function ShutdownCountdown() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // September 30th, 2024 at 11:59 PM EDT (end of fiscal year)
    const shutdownDate = new Date('2024-09-30T23:59:59-04:00').getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const difference = shutdownDate - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible || !timeLeft) return null

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`relative overflow-hidden ${
          isUrgent 
            ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800' 
            : 'bg-gradient-to-r from-orange-600 via-red-600 to-red-700'
        } text-white`}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        </div>

        <div className="relative z-10 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0"
              >
                <AlertTriangle className="w-6 h-6 text-yellow-300" />
              </motion.div>
              
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {isUrgent ? '🚨 CRITICAL ALERT 🚨' : '⚠️ GOVERNMENT SHUTDOWN WARNING ⚠️'}
                </h3>
                <p className="text-xs opacity-90">
                  {isUrgent 
                    ? 'Fiscal year ends in HOURS - Government shutdown imminent!' 
                    : 'Potential US Government shutdown countdown'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Countdown Timer */}
              <div className="flex items-center space-x-4 text-center">
                {timeLeft.days > 0 && (
                  <div className="flex flex-col">
                    <motion.div
                      key={timeLeft.days}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-bold"
                    >
                      {timeLeft.days}
                    </motion.div>
                    <div className="text-xs opacity-75">DAYS</div>
                  </div>
                )}
                
                <div className="flex flex-col">
                  <motion.div
                    key={timeLeft.hours}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold"
                  >
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </motion.div>
                  <div className="text-xs opacity-75">HOURS</div>
                </div>
                
                <div className="flex flex-col">
                  <motion.div
                    key={timeLeft.minutes}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold"
                  >
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </motion.div>
                  <div className="text-xs opacity-75">MIN</div>
                </div>
                
                <div className="flex flex-col">
                  <motion.div
                    key={timeLeft.seconds}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-2xl font-bold ${isUrgent ? 'text-yellow-300' : ''}`}
                  >
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </motion.div>
                  <div className="text-xs opacity-75">SEC</div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Urgent pulsing effect */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 bg-red-500 opacity-20"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
