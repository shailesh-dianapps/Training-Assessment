const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');

// Middleware to verify JWT token and validate session
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Validate session and get user
    const user = await authService.validateSession(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    req.token = token; // Store token for logout operations
    next();
  } 
  catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: error.message
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Authentication failed'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }

  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource && req.resource[resourceUserField];
    if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
      return next();
    }

    // Check if accessing own profile
    if (req.params.id === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own resources'
    });
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to update user activity
const updateUserActivity = async (req, res, next) => {
  if (req.user) {
    try {
      // Update user's last activity without waiting for the response
      req.user.updateLastActivity().catch(err => {
        console.error('Error updating user activity:', err);
      });
    } catch (error) {
      // Don't block the request if activity update fails
      console.error('Error updating user activity:', error);
    }
  }
  next();
};

// Middleware to check if user has required role(s)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

// Middleware to check if user is manager or admin
const requireManagerOrAdmin = requireRole(['manager', 'admin']);

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireRole,
  requireManagerOrAdmin,
  optionalAuth,
  updateUserActivity
};