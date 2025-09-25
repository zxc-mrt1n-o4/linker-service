const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

// Test database connection
async function testDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    )
    
    await Promise.race([prisma.$connect(), timeoutPromise])
    console.log('✅ Database connection successful')
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('Continuing without database connection...')
    // Don't exit the process, just log the error
  }
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Listen on all network interfaces
const port = process.env.PORT || 3000

console.log('🚀 Starting Linker Platform Server...')
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`Port: ${port}`)
console.log(`Hostname: ${hostname}`)

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Test database connection
  await testDatabaseConnection()
  const httpServer = createServer((req, res) => {
    // Handle health check directly
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Linker Platform'
      }))
      return
    }
    
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })
  
  // Socket.io setup
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow connections from any origin
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Store connected users
  const connectedUsers = new Map()

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Handle user authentication
    socket.on('authenticate', (userData) => {
      if (userData && userData.id) {
        connectedUsers.set(socket.id, userData)
        console.log(`User ${userData.username} authenticated`)
        
        // Broadcast user count update
        io.emit('userCount', connectedUsers.size)
      }
    })

    // Handle new messages
    socket.on('sendMessage', (messageData) => {
      const user = connectedUsers.get(socket.id)
      if (user && messageData.content) {
        const message = {
          id: messageData.id || Date.now().toString(),
          content: messageData.content,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          },
          createdAt: new Date().toISOString()
        }
        
        // Broadcast message to all connected clients
        io.emit('newMessage', message)
        console.log(`Message from ${user.username}: ${messageData.content}`)
      }
    })

    // Handle typing indicators
    socket.on('typing', (isTyping) => {
      const user = connectedUsers.get(socket.id)
      if (user) {
        socket.broadcast.emit('userTyping', {
          userId: user.id,
          username: user.username,
          isTyping
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id)
      if (user) {
        console.log(`User ${user.username} disconnected`)
        connectedUsers.delete(socket.id)
        
        // Broadcast updated user count
        io.emit('userCount', connectedUsers.size)
      }
    })
  })

  httpServer.listen(port, hostname, (err) => {
    if (err) {
      console.error('Failed to start server:', err)
      process.exit(1)
    }
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.io server running`)
    console.log(`> Your local IP: http://${getLocalIP()}:${port}`)
  })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  process.exit(1)
})

// Helper function to get local IP address
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (!net.internal && net.family === 'IPv4') {
        return net.address;
      }
    }
  }
  return 'localhost';
}