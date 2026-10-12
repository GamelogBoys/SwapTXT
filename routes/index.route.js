const express = require('express')
const router = express.Router()
const {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  logoutUser
} = require('../controllers/auth.controller')
const {
  getChatDashboard,
  getMessageHistory,
  addContact,
  uploadMiddleware,
  uploadAttachment
} = require('../controllers/chat.controller')

router.get('/', getChatDashboard)
router.get('/login', (req, res) => {
  res.render('login')
})
router.get('/register', (req, res) => {
  res.render('auth')
})
router.get('/verify-otp', (req, res) => {
  const email = req.query.email || ''
  res.render('verify-otp', { email })
})

router.post('/register', registerUser)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)
router.post('/login', loginUser)
router.get('/logout', logoutUser)

router.get('/api/messages/:otherEmail', getMessageHistory)
router.post('/add-contact', addContact)
router.post('/api/upload', uploadMiddleware, uploadAttachment)

module.exports = router