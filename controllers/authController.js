const authService = require('../services/authService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const deviceInfo = authService.parseDeviceInfo(
      req.get('User-Agent'),
      req.ip
    );
    
    const result = await authService.register(req.body, deviceInfo);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: 'Email already exists'
      });
    }

    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = authService.parseDeviceInfo(
      req.get('User-Agent'),
      req.ip
    );
    
    const result = await authService.login(email, password, deviceInfo);

    res.json({
      success: true,
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile retrieval failed',
      message: 'Internal server error'
    });
  }
};

// @desc    Logout user (revoke session)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    await authService.logout(req.token);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAllDevices = async (req, res) => {
  try {
    await authService.logoutAllDevices(req.user._id);
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout all failed',
      message: error.message
    });
  }
};

// @desc    Reset password with JWT token
// @route   POST /api/auth/reset-password
// @access  Private (requires reset token)
const resetPassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Reset token is required in Authorization header'
      });
    }

    const { newPassword } = req.body;
    const result = await authService.resetPasswordWithToken(token, newPassword);

    res.json(result);
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      error: 'Password reset failed',
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username, fullName, designation, avatar } = req.body;
    const user = req.user;

    // Update fields if provided
    if (username !== undefined) user.username = username;
    if (fullName !== undefined) user.fullName = fullName;
    if (designation !== undefined) user.designation = designation;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Profile update failed',
        message: 'Username already exists'
      });
    }

    res.status(400).json({
      success: false,
      error: 'Profile update failed',
      message: error.message
    });
  }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(
      email,
      req.ip,
      req.get('User-Agent')
    );

    res.json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({
      success: false,
      error: 'Forgot password failed',
      message: error.message
    });
  }
};

// @desc    Verify OTP for forgot password
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyForgotPasswordOTP(email, otp);

    res.json(result);
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(400).json({
      success: false,
      error: 'OTP verification failed',
      message: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser,
  logoutAllDevices,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword
};