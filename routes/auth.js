const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { registerValidation, loginValidation, updateProfileValidation, forgotPasswordValidation, verifyOTPValidation, resetPasswordValidation } = require('../validations/authValidation');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser,
  logoutAllDevices,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate(registerValidation), registerUser);
router.post('/login', validate(loginValidation), loginUser);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, validate(updateProfileValidation), updateProfile);
router.post('/logout', authenticateToken, logoutUser);
router.post('/logout-all', authenticateToken, logoutAllDevices);

// Forgot Password Flow
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/verify-otp', validate(verifyOTPValidation), verifyForgotPasswordOTP);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);

module.exports = router;