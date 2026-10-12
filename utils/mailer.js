const nodemailer = require('nodemailer')
const OTP = require('../models/otp.model.js')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000
})

const sendOTPVerificationEmail = async (email, displayName) => {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    await OTP.deleteMany({ email })

    await OTP.create({ email, otp })
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; }
          .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); overflow: hidden; }
          .header { background: #4f46e5; padding: 32px 24px; text-align: center; color: #ffffff; }
          .logo { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
          .content { padding: 32px 24px; text-align: center; color: #334155; }
          .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; font-size: 32px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; margin: 24px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">💬</div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Verification Code</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-top: 0;">Hi <strong>${displayName || 'User'}</strong>,</p>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Please use the verification code below to complete your registration. This code is valid for <strong>2 minutes</strong>.</p>
            
            <div class="otp-box">${otp}</div>

            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">If you did not request this verification, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Realtime Messenger Inc. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
    await transporter.sendMail({
      from: `"SwapTxt" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${otp} is your verification code`,
      html: htmlContent
    })

    return true
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error
  }
}

module.exports = { sendOTPVerificationEmail }
