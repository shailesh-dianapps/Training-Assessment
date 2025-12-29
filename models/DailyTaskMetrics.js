const mongoose = require('mongoose');

const dailyTaskMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  tasksCreated: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  pendingTasks: {
    type: Number,
    default: 0
  },
  inProgressTasks: {
    type: Number,
    default: 0
  },
  overdueTasks: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  averageCompletionTime: {
    type: Number, // in hours
    default: 0
  },
  tasksByPriority: {
    low: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    urgent: { type: Number, default: 0 }
  },
  tasksByStatus: {
    pending: { type: Number, default: 0 },
    in_progress: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for efficient date queries
dailyTaskMetricsSchema.index({ date: -1 });

// Static method to create or update daily metrics
dailyTaskMetricsSchema.statics.createOrUpdateMetrics = async function(date, metrics) {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  return this.findOneAndUpdate(
    { date: dateOnly },
    { $set: metrics },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method to get metrics for date range
dailyTaskMetricsSchema.statics.getMetricsForRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get latest metrics
dailyTaskMetricsSchema.statics.getLatestMetrics = function(limit = 30) {
  return this.find({}).sort({ date: -1 }).limit(limit);
};

module.exports = mongoose.model('DailyTaskMetrics', dailyTaskMetricsSchema);