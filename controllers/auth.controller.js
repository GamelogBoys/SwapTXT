const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const bcrypt = require('bcryptjs');
const { sendOTPVerificationEmail } = require('../utils/mailer');

/**
 * @desc    Handle initial registration & send 4-digit OTP
 * @route   POST /register
 */
const registerUser = async (req, res) => {
  const { displayName, email, password, confirmPassword, terms } = req.body;

  // 1. Validation Checks
  if (!terms) {
    req.flash('warn', 'You must agree to the Terms of Service.');
    return res.redirect('/register');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match. Please try again.');
    return res.redirect('/register');
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if account already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      req.flash('warn', 'An account with that email already exists. Please log in.');
      return res.redirect('/login');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save pending registration data temporarily in session
    req.session.pendingUser = {
      displayName: displayName.trim(),
      email: normalizedEmail,
      password: hashedPassword
    };

    // 5. Send OTP Email
    await sendOTPVerificationEmail(normalizedEmail, displayName);

    req.flash('success', 'Verification code sent to your email.');
    res.redirect(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);

  } catch (err) {
    console.error('Registration Error:', err);
    req.flash('error', 'Failed to send OTP code. Please try again.');
    res.redirect('/register');
  }
};

/**
 * @desc    Verify 4-Digit OTP & create user in MongoDB
 * @route   POST /verify-otp
 */
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();

  try {
    // 1. Check if OTP exists and is valid
    const otpRecord = await OTP.findOne({ email: normalizedEmail, otp: otp.trim() });

    if (!otpRecord) {
      req.flash('error', 'Invalid or expired OTP code. Please try again or request a new code.');
      return res.redirect(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
    }

    // 2. Retrieve pending user data from session
    const pendingUser = req.session.pendingUser;
    if (!pendingUser || pendingUser.email !== normalizedEmail) {
      req.flash('error', 'Session expired. Please register again.');
      return res.redirect('/register');
    }

    // 3. Save User in Database
    const newUser = await User.create({
      displayName: pendingUser.displayName,
      email: pendingUser.email,
      password: pendingUser.password
    });

    // 4. Clean up OTP and Session
    await OTP.deleteOne({ _id: otpRecord._id });
    delete req.session.pendingUser;

    // 5. Set Logged In Session
    req.session.user = {
      id: newUser._id,
      displayName: newUser.displayName,
      email: newUser.email
    };

    req.flash('success', `Welcome ${newUser.displayName}! Your account has been verified.`);
    res.redirect('/');

  } catch (err) {
    console.error('OTP Verification Error:', err);
    req.flash('error', 'Verification failed. Please try again.');
    res.redirect(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
  }
};

/**
 * @desc    Resend a new 4-digit OTP to the user
 * @route   POST /resend-otp
 */
const resendOTP = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();

  try {
    const pendingUser = req.session.pendingUser;
    const displayName = pendingUser?.displayName || 'User';

    await sendOTPVerificationEmail(normalizedEmail, displayName);

    req.flash('success', 'A new 4-digit code has been sent to your email.');
    res.redirect(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);

  } catch (err) {
    console.error('Resend OTP Error:', err);
    req.flash('error', 'Failed to resend code. Please try again.');
    res.redirect(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
  }
};

/**
 * @desc    Authenticate existing user with Email & Password
 * @route   POST /login
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find User by Email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      req.flash('error', 'No user found with that email address.');
      return res.redirect('/login');
    }

    // 2. Validate Password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      req.flash('error', 'Invalid password. Please try again.');
      return res.redirect('/login');
    }

    // 3. Store User in Session
    req.session.user = {
      id: user._id,
      displayName: user.displayName,
      email: user.email
    };

    req.flash('success', `Welcome back, ${user.displayName}!`);
    res.redirect('/');

  } catch (err) {
    console.error('Login Error:', err);
    req.flash('error', 'Something went wrong during login. Please try again.');
    res.redirect('/login');
  }
};

/**
 * @desc    Log out user & destroy session
 * @route   GET /logout
 */
const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  logoutUser
};