const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: [true, 'Token hash is required'],
    index: true
  },
  deviceInfo: {
    userAgent: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    deviceType: {
      type: String,
      enum: ['web', 'mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      trim: true
    },
    os: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  loginAt: {
    type: Date,
    default: Date.now
  },
  logoutAt: {
    type: Date,
    default: null
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  revokeReason: {
    type: String,
    enum: ['logout', 'logout_all', 'manual_revoke', 'admin_revoke', 'security_breach', 'expired', 'new_login', 'password_change'],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, expiresAt: 1 });
sessionSchema.index({ tokenHash: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1, isActive: 1 });

// Virtual for checking if session is expired
sessionSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for session duration
sessionSchema.virtual('sessionDuration').get(function() {
  const endTime = this.logoutAt || new Date();
  return Math.floor((endTime - this.loginAt) / (1000 * 60)); // Duration in minutes
});

// Virtual for time until expiry
sessionSchema.virtual('timeUntilExpiry').get(function() {
  const now = new Date();
  if (this.expiresAt <= now) return 0;
  return Math.floor((this.expiresAt - now) / (1000 * 60)); // Minutes until expiry
});

// Instance method to revoke session
sessionSchema.methods.revoke = function(reason = 'logout', revokedBy = null) {
  this.isActive = false;
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.logoutAt = new Date();
  this.revokeReason = reason;
  if (revokedBy) {
    this.revokedBy = revokedBy;
  }
  return this.save();
};

// Instance method to update activity
sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

// Instance method to extend expiry
sessionSchema.methods.extendExpiry = function(hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.lastActivity = new Date();
  return this.save();
};

// Static method to create new session
sessionSchema.statics.createSession = async function(userId, token, tokenHash, deviceInfo = {}, expiryHours = 24) {
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  
  const session = new this({
    userId,
    token,
    tokenHash,
    deviceInfo,
    expiresAt
  });
  
  return session.save();
};

// Static method to find active session by token hash
sessionSchema.statics.findActiveByTokenHash = function(tokenHash) {
  return this.findOne({
    tokenHash,
    isActive: true,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId', '-password');
};

// Static method to find user's active sessions
sessionSchema.statics.findUserActiveSessions = function(userId) {
  return this.find({
    userId,
    isActive: true,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
};

// Static method to revoke all user sessions
sessionSchema.statics.revokeAllUserSessions = async function(userId, reason = 'security_breach', revokedBy = null) {
  const sessions = await this.find({
    userId,
    isActive: true,
    isRevoked: false
  });
  
  const revokePromises = sessions.map(session => 
    session.revoke(reason, revokedBy)
  );
  
  return Promise.all(revokePromises);
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpiredSessions = async function() {
  const result = await this.updateMany(
    {
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isActive: false }
      ],
      isRevoked: false
    },
    {
      $set: {
        isActive: false,
        isRevoked: true,
        revokedAt: new Date(),
        revokeReason: 'expired'
      }
    }
  );
  
  return result;
};

// Static method to get session statistics
sessionSchema.statics.getSessionStats = async function(userId = null) {
  const matchCondition = userId ? { userId } : {};
  
  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isActive', true] },
                  { $eq: ['$isRevoked', false] },
                  { $gt: ['$expiresAt', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        expiredSessions: {
          $sum: {
            $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0]
          }
        },
        revokedSessions: {
          $sum: {
            $cond: [{ $eq: ['$isRevoked', true] }, 1, 0]
          }
        },
        averageSessionDuration: {
          $avg: {
            $divide: [
              {
                $subtract: [
                  { $ifNull: ['$logoutAt', new Date()] },
                  '$loginAt'
                ]
              },
              1000 * 60 // Convert to minutes
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalSessions: 0,
    activeSessions: 0,
    expiredSessions: 0,
    revokedSessions: 0,
    averageSessionDuration: 0
  };
};

// Pre-save middleware to set logout time when session becomes inactive
sessionSchema.pre('save', function(next) {
  if (this.isModified('isActive') && !this.isActive && !this.logoutAt) {
    this.logoutAt = new Date();
  }
  next();
});

// TTL index to automatically delete expired sessions after 30 days
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Session', sessionSchema);