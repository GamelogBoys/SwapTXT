const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true, lowercase: true, trim: true },
  recipientEmail: { type: String, required: true, lowercase: true, trim: true },
  text: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  fileType: { type: String, default: '' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 864000 }
})

messageSchema.index({ senderEmail: 1, recipientEmail: 1, createdAt: -1 })

const Message = mongoose.model('Message', messageSchema)
module.exports = Message