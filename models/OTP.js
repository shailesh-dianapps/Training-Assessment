const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: 6
  },
  otpHash: {
    type: String,
    required: [true, 'OTP hash is required']
  },
  purpose: {
    type: String,
    enum: ['forgot_password', 'email_verification', 'account_activation'],
    required: [true, 'OTP purpose is required'],
    default: 'forgot_password'
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ email: 1, isUsed: 1, expiresAt: 1 });
otpSchema.index({ otpHash: 1, isUsed: 1, expiresAt: 1 });

// Virtual for checking if OTP is expired
otpSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for checking if OTP is valid (verified, not used, not expired, attempts < 5)
otpSchema.virtual('isValid').get(function() {
  return this.isVerified && !this.isUsed && !this.isExpired && this.attempts < 5;
});

// Virtual for remaining attempts
otpSchema.virtual('remainingAttempts').get(function() {
  return Math.max(0, 5 - this.attempts);
});

// Instance method to mark OTP as verified
otpSchema.methods.markAsVerified = function() {
  this.isVerified = true;
  return this.save();
};

// Instance method to mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Instance method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create new OTP
otpSchema.statics.createOTP = async function(email, purpose = 'forgot_password', expiryMinutes = 10, ipAddress = null, userAgent = null) {
  const crypto = require('crypto');
  
  // Generate 6-digit OTP
  const otp = this.generateOTP();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Set expiry time
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  // Invalidate any existing OTPs for this email and purpose
  await this.updateMany(
    { email, purpose, isUsed: false },
    { $set: { isUsed: true, usedAt: new Date() } }
  );
  
  // Create new OTP
  const otpRecord = new this({
    email,
    otp,
    otpHash,
    purpose,
    expiresAt,
    ipAddress,
    userAgent
  });
  
  await otpRecord.save();
  
  return {
    otpId: otpRecord._id,
    otp, // Return plain OTP for sending (in real app, send via email/SMS)
    expiresAt,
    expiryMinutes
  };
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp, purpose = 'forgot_password') {
  const crypto = require('crypto');
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Find valid OTP
  const otpRecord = await this.findOne({
    email,
    otpHash,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!otpRecord) {
    // Try to find any OTP record to increment attempts
    const anyOtpRecord = await this.findOne({
      email,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    if (anyOtpRecord && anyOtpRecord.attempts < 5) {
      await anyOtpRecord.incrementAttempts();
      throw new Error(`Invalid OTP. ${anyOtpRecord.remainingAttempts - 1} attempts remaining.`);
    }
    
    throw new Error('Invalid or expired OTP');
  }
  
  // Check attempts limit
  if (otpRecord.attempts >= 5) {
    throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
  }
  
  // Mark as verified
  await otpRecord.markAsVerified();
  
  return {
    otpId: otpRecord._id,
    email: otpRecord.email,
    purpose: otpRecord.purpose,
    verifiedAt: new Date()
  };
};

// Static method to find verified OTP for password reset
otpSchema.statics.findVerifiedOTP = async function(email, purpose = 'forgot_password') {
  return this.findOne({
    email,
    purpose,
    isVerified: true,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to cleanup expired OTPs
otpSchema.statics.cleanupExpiredOTPs = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Delete used OTPs older than 24 hours
    ]
  });
  
  return result;
};

// Static method to get OTP statistics
otpSchema.statics.getOTPStats = async function(email = null) {
  const matchCondition = email ? { email } : {};
  
  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalOTPs: { $sum: 1 },
        usedOTPs: {
          $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] }
        },
        expiredOTPs: {
          $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] }
        },
        activeOTPs: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isUsed', false] },
                  { $gt: ['$expiresAt', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        averageAttempts: { $avg: '$attempts' }
      }
    }
  ]);
  
  return stats[0] || {
    totalOTPs: 0,
    usedOTPs: 0,
    expiredOTPs: 0,
    activeOTPs: 0,
    averageAttempts: 0
  };
};

// Pre-save middleware to ensure OTP is 6 digits
otpSchema.pre('save', function(next) {
  if (this.isModified('otp') && this.otp.length !== 6) {
    return next(new Error('OTP must be exactly 6 digits'));
  }
  next();
});

// TTL index to automatically delete expired OTPs after 1 hour
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('OTP', otpSchema);