const mongoose = require('mongoose');

const taskActivitySchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: [true, 'Task ID is required'],
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'completed', 'commented'],
    required: [true, 'Action is required']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  metadata: {
    previousValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    changes: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskActivitySchema.index({ taskId: 1, createdAt: -1 });
taskActivitySchema.index({ userId: 1, createdAt: -1 });
taskActivitySchema.index({ action: 1 });
taskActivitySchema.index({ createdAt: -1 });

// Static method to log activity
taskActivitySchema.statics.logActivity = function(activityData) {
  const activity = new this(activityData);
  return activity.save();
};

// Static method to get activity by task
taskActivitySchema.statics.getTaskActivity = function(taskId, options = {}) {
  const { page = 1, limit = 50, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ taskId })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get activity by user
taskActivitySchema.statics.getUserActivity = function(userId, options = {}) {
  const { page = 1, limit = 50, sort = '-createdAt', action } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  if (action) query.action = action;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get activity statistics
taskActivitySchema.statics.getActivityStats = async function(timeframe = 'today') {
  let startDate;
  const now = new Date();
  
  switch (timeframe) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalActivity = await this.countDocuments({
    createdAt: { $gte: startDate }
  });
  
  const activeUsers = await this.distinct('userId', {
    createdAt: { $gte: startDate }
  });
  
  return {
    totalActivity,
    activeUsers: activeUsers.length,
    actionBreakdown: stats,
    timeframe
  };
};

// Static method to get most active users
taskActivitySchema.statics.getMostActiveUsers = function(limit = 10, timeframe = 'week') {
  let startDate;
  const now = new Date();
  
  switch (timeframe) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        activityCount: { $sum: 1 },
        actions: { $push: '$action' }
      }
    },
    {
      $sort: { activityCount: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('TaskActivity', taskActivitySchema);