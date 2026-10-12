const User = require('../models/user.model')
const Message = require('../models/message.model')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
})

const uploadAttachment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const senderEmail = req.session.user.email
    const recipientEmail = req.body.recipientEmail?.toLowerCase().trim()
    const fileUrl = `/uploads/${req.file.filename}`
    const originalName = req.file.originalname

    const newMessage = await Message.create({
      senderEmail,
      recipientEmail,
      text: `[Attachment: ${originalName}]`,
      fileUrl,
      fileType: req.file.mimetype
    })

    const io = req.app.get('io')
    const onlineUsers = req.app.get('onlineUsers')
    const recipientSocketId = onlineUsers.get(recipientEmail)

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', newMessage)
    }
    const senderSocketId = onlineUsers.get(senderEmail)
    if (senderSocketId) {
      io.to(senderSocketId).emit('receive_message', newMessage)
    }

    const filePath = req.file.path
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error auto-deleting file:', err)
        }
      })
    }, 60000)

    res.status(200).json({ success: true, message: newMessage })
  } catch (err) {
    console.error('Attachment upload error:', err)
    res.status(500).json({ error: 'Failed to upload attachment' })
  }
}

const getChatDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login')
    }

    const myEmail = req.session.user.email

    const sent = await Message.find({ senderEmail: myEmail }).distinct('recipientEmail')
    const received = await Message.find({ recipientEmail: myEmail }).distinct('senderEmail')
    
    const contactEmails = [...new Set([...sent, ...received])]

    const contacts = await User.find({ email: { $in: contactEmails } }).select('displayName email')

    res.render('index', {
      user: req.session.user,
      contacts
    })
  } catch (err) {
    res.render('index', { user: req.session.user || null, contacts: [] })
  }
}

const getMessageHistory = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const myEmail = req.session.user.email
    const otherEmail = req.params.otherEmail

    const messages = await Message.find({
      $or: [
        { senderEmail: myEmail, recipientEmail: otherEmail },
        { senderEmail: otherEmail, recipientEmail: myEmail }
      ]
    }).sort({ createdAt: 1 })

    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

const addContact = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login')
    }

    const { contactEmail } = req.body
    const hostEmail = req.session.user.email
    const normalizedEmail = contactEmail?.toLowerCase().trim()

    if (normalizedEmail === hostEmail) {
      req.flash('error', 'You cannot add yourself as a contact')
      return res.redirect('/')
    }

    const targetUser = await User.findOne({ email: normalizedEmail })
    if (!targetUser) {
      req.flash('error', 'User does not exist with that email address')
      return res.redirect('/')
    }

    const io = req.app.get('io')
    const onlineUsers = req.app.get('onlineUsers')
    const targetSocketId = onlineUsers.get(normalizedEmail)

    if (targetSocketId) {
      io.to(targetSocketId).emit('chat_invite', {
        senderEmail: hostEmail,
        senderName: req.session.user.displayName
      })
      req.flash('success', 'Invitation sent successfully')
    } else {
      req.flash('warn', 'User is currently offline. Invitation cannot be delivered right now')
    }

    res.redirect('/')
  } catch (err) {
    req.flash('error', 'Failed to send contact invitation')
    res.redirect('/')
  }
}

module.exports = {
  getChatDashboard,
  getMessageHistory,
  addContact,
  uploadMiddleware: upload.single('file'),
  uploadAttachment
}