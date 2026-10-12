require('dotenv').config()
require('./config/db.connect.js')

const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const server = http.createServer(app)
const io = new Server(server)

const flash = require('connect-flash')
const session = require('express-session')
const path = require('path')
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT
const HOST = process.env.HOST
const indexRoute = require('./routes/index.route.js')
const Message = require('./models/message.model')

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})

app.use(sessionMiddleware)
app.use(flash())
app.use((req, res, next) => {
  res.locals.flashMessages = {
    success: req.flash('success'),
    warn: req.flash('warn'),
    error: req.flash('error')
  }
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set("view engine", 'ejs')
app.use(express.static(path.join(__dirname, "public")))

const onlineUsers = new Map()

app.set('io', io)
app.set('onlineUsers', onlineUsers)

app.use("/", indexRoute)

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, () => {
    if (socket.request.session && socket.request.session.user) {
      socket.user = socket.request.session.user
      next()
    } else {
      next(new Error('Unauthorized'))
    }
  })
})

io.on('connection', (socket) => {
  const userEmail = socket.user.email
  onlineUsers.set(userEmail, socket.id)
  
  // Broadcast to everyone that this user is online
  io.emit('user_status', { email: userEmail, status: 'online' })

  // Send the list of currently online emails to the newly connected user
  socket.emit('online_users_list', Array.from(onlineUsers.keys()))

  socket.on('send_message', async ({ recipientEmail, text }) => {
    try {
      if (!text || !text.trim() || !recipientEmail) return
      const newMessage = await Message.create({
        senderEmail: userEmail,
        recipientEmail: recipientEmail.toLowerCase().trim(),
        text: text.trim()
      })
      const recipientSocketId = onlineUsers.get(recipientEmail)
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', newMessage)
      }
      socket.emit('receive_message', newMessage)
    } catch (err) {
      socket.emit('message_error', { error: 'Failed to send message' })
    }
  })

  socket.on('invite_response', ({ senderEmail, accepted }) => {
    const hostSocketId = onlineUsers.get(senderEmail)
    if (hostSocketId) {
      io.to(hostSocketId).emit('invite_response_result', {
        accepted,
        responderEmail: userEmail,
        responderName: socket.user.displayName
      })
    }
  })

  socket.on('disconnect', () => {
    onlineUsers.delete(userEmail)
    io.emit('user_status', { email: userEmail, status: 'offline' })
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`)
})