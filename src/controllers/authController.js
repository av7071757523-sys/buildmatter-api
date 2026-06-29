const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

// ==========================
// GENERATE TOKENS
// ==========================
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

// ==========================
// REGISTER
// ==========================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, created_at',
      [name, email, hashedPassword, role || 'customer', phone || null]
    );
    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);
    await pool.query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// LOGIN
// ==========================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    const { accessToken, refreshToken } = generateTokens(user);
    await pool.query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);
    return res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// REFRESH TOKEN
// ==========================
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    const result = await pool.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.id, refreshToken]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const user = result.rows[0];
    const tokens = generateTokens(user);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);
    return res.json({ success: true, token: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// ==========================
// SEND OTP
// ==========================
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'UPDATE users SET otp = $1, otp_expires = $2 WHERE phone = $3',
      [otp, otpExpires, phone]
    );
    console.log('OTP for', phone, ':', otp);
    return res.json({ success: true, message: 'OTP sent successfully', otp });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// VERIFY OTP
// ==========================
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE phone = $1 AND otp = $2', [phone, otp]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    const user = result.rows[0];
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    await pool.query('UPDATE users SET otp = NULL, otp_expires = NULL, is_verified = TRUE WHERE id = $1', [user.id]);
    const { accessToken, refreshToken } = generateTokens(user);
    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// FORGOT PASSWORD
// ==========================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('UPDATE users SET otp = $1, otp_expires = $2 WHERE email = $3', [otp, otpExpires, email]);
    console.log('Password reset OTP for', email, ':', otp);
    return res.json({ success: true, message: 'Password reset OTP sent', otp });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// RESET PASSWORD
// ==========================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND otp = $2', [email, otp]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    const user = result.rows[0];
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, otp = NULL, otp_expires = NULL WHERE id = $2', [hashedPassword, user.id]);
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// GET PROFILE
// ==========================
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, avatar, is_verified, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// UPDATE PROFILE
// ==========================
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = $1, phone = $2, avatar = $3 WHERE id = $4 RETURNING id, name, email, role, phone, avatar',
      [name, phone, avatar, req.user.id]
    );
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================
// LOGOUT
// ==========================
const logout = async (req, res) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerUser, loginUser, refreshToken, sendOtp, verifyOtp, forgotPassword, resetPassword, getMe, updateProfile, logout };