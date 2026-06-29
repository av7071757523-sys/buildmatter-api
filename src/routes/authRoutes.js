const express = require('express');
const router = express.Router();
const {
  registerUser, loginUser, refreshToken, sendOtp, verifyOtp,
  forgotPassword, resetPassword, getMe, updateProfile, logout
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.post('/logout', authMiddleware, logout);

module.exports = router;