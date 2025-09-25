const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Listen on all network interfaces
const port = process.env.PORT || 3001

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
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
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.io server running`)
    console.log(`> Your local IP: http://${getLocalIP()}:${port}`)
  })
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