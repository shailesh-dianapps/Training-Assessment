const User = require('../models/User');
const Session = require('../models/Session');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Generate token hash for storage
  generateTokenHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Parse device info from request
  parseDeviceInfo(userAgent, ipAddress) {
    const deviceInfo = {
      userAgent: userAgent || 'Unknown',
      ipAddress: ipAddress || 'Unknown',
      deviceType: 'unknown',
      browser: 'Unknown',
      os: 'Unknown'
    };

    if (userAgent) {
      // Simple device type detection
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        deviceInfo.deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
      } else if (/Electron/.test(userAgent)) {
        deviceInfo.deviceType = 'desktop';
      } else {
        deviceInfo.deviceType = 'web';
      }

      // Simple browser detection
      if (/Chrome/.test(userAgent)) deviceInfo.browser = 'Chrome';
      else if (/Firefox/.test(userAgent)) deviceInfo.browser = 'Firefox';
      else if (/Safari/.test(userAgent)) deviceInfo.browser = 'Safari';
      else if (/Edge/.test(userAgent)) deviceInfo.browser = 'Edge';

      // Simple OS detection
      if (/Windows/.test(userAgent)) deviceInfo.os = 'Windows';
      else if (/Mac/.test(userAgent)) deviceInfo.os = 'macOS';
      else if (/Linux/.test(userAgent)) deviceInfo.os = 'Linux';
      else if (/Android/.test(userAgent)) deviceInfo.os = 'Android';
      else if (/iOS/.test(userAgent)) deviceInfo.os = 'iOS';
    }

    return deviceInfo;
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register new user
  async register(userData, deviceInfo = {}) {
    try {
      const { username, email, password, fullName, designation, role = 'user', avatar } = userData;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if username already exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new Error('Username already exists');
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        fullName,
        designation,
        role,
        avatar
      });

      await user.save();

      // Generate token and create session
      const token = this.generateToken(user._id);
      const tokenHash = this.generateTokenHash(token);
      
      // Create session
      await Session.createSession(user._id, token, tokenHash, deviceInfo);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password, deviceInfo = {}) {
    try {
      // Find user with password field
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token and create session
      const token = this.generateToken(user._id);
      const tokenHash = this.generateTokenHash(token);
      
      // Create new session
      await Session.createSession(user._id, token, tokenHash, deviceInfo);

      // Update last login and activity
      user.lastLogin = new Date();
      await user.updateLastActivity();

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Validate session and get user
  async validateSession(token) {
    try {
      // Verify JWT token
      const decoded = this.verifyToken(token);
      const tokenHash = this.generateTokenHash(token);
      
      // Find active session
      const session = await Session.findActiveByTokenHash(tokenHash);
      if (!session) {
        throw new Error('Invalid or expired session');
      }

      // Update session activity
      await session.updateActivity();

      return session.userId;
    } catch (error) {
      throw error;
    }
  }

  // Logout user (revoke session)
  async logout(token, reason = 'logout') {
    try {
      const tokenHash = this.generateTokenHash(token);
      const session = await Session.findOne({ tokenHash, isActive: true });
      
      if (session) {
        await session.revoke(reason);
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Logout from all devices
  async logoutAllDevices(userId, reason = 'logout_all') {
    try {
      await Session.revokeAllUserSessions(userId, reason);
      return { message: 'Logged out from all devices successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated through profile
      const { password, role, isActive, ...allowedUpdates } = updateData;

      const user = await User.findByIdAndUpdate(
        userId,
        allowedUpdates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Forgot password - Send OTP
  async forgotPassword(email, ipAddress = null, userAgent = null) {
    try {
      const user = await User.findByEmail(email);
      
      if (user && user.isActive) {
        // Generate OTP only for existing active users
        const otpData = await OTP.createOTP(email, 'forgot_password', 10, ipAddress, userAgent);
        
        // In development mode, log the OTP to console for testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] OTP for ${email}: ${otpData.otp} (expires in 10 minutes)`);
        }
        
        // In a real application, you would send the OTP via email here
      }

      // Always return the same message for security (don't reveal if email exists)
      return {
        success: true,
        message: 'If the email exists in our system, an OTP has been sent to your email address.'
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify OTP for forgot password and generate token
  async verifyForgotPasswordOTP(email, otp) {
    try {
      const verification = await OTP.verifyOTP(email, otp, 'forgot_password');
      
      // Find user to generate token
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate JWT token for password reset (valid for 15 minutes)
      const resetToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          purpose: 'password_reset',
          otpId: verification.otpId 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return {
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        resetToken,
        expiresIn: '15 minutes'
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset password with JWT token
  async resetPasswordWithToken(token, newPassword) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'password_reset') {
        throw new Error('Invalid token purpose');
      }

      // Check if OTP is still verified and not used
      const otpRecord = await OTP.findById(decoded.otpId);
      if (!otpRecord || !otpRecord.isVerified || otpRecord.isUsed || otpRecord.isExpired) {
        throw new Error('Invalid or expired reset session');
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || user.email !== decoded.email) {
        throw new Error('User not found');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Mark OTP as used
      await otpRecord.markAsUsed();

      // Revoke all active sessions for security
      await Session.revokeAllUserSessions(user._id, 'password_change');

      return {
        success: true,
        message: 'Password has been reset successfully. Please login with your new password.'
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Invalid or expired reset token');
      }
      throw error;
    }
  }

  // Cleanup expired sessions (for cron job)
  async cleanupExpiredSessions() {
    try {
      const result = await Session.cleanupExpiredSessions();
      return {
        message: `Cleaned up ${result.modifiedCount} expired sessions`
      };
    } catch (error) {
      throw error;
    }
  }

  // Get session statistics
  async getSessionStats(userId = null) {
    try {
      return await Session.getSessionStats(userId);
    } catch (error) {
      throw error;
    }
  }

  // Verify email (placeholder)
  async verifyEmail(verificationToken) {
    try {
      // In a real application, you would:
      // 1. Find user by verification token
      // 2. Check if token is valid and not expired
      // 3. Mark email as verified
      // 4. Clear verification token

      throw new Error('Email verification functionality not implemented');
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email (placeholder)
  async resendVerificationEmail(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return { message: 'If the email exists, a verification link has been sent' };
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      // In a real application, you would:
      // 1. Generate new verification token
      // 2. Send verification email

      return { message: 'If the email exists, a verification link has been sent' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();