const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  completedAt: {
    type: Date
  },
  isOverdue: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdAt: 1 });
taskSchema.index({ priority: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isTaskOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for task age in days
taskSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Instance method to mark task as completed
taskSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.isOverdue = false;
  return this.save();
};

// Instance method to check if task is overdue
taskSchema.methods.checkOverdue = function() {
  const isOverdue = this.dueDate < new Date() && this.status !== 'completed';
  if (isOverdue !== this.isOverdue) {
    this.isOverdue = isOverdue;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find overdue tasks
taskSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed'] },
    isOverdue: { $ne: true }
  }).populate('assignedTo', 'username fullName email').populate('createdBy', 'username fullName email');
};

// Static method to get tasks created today
taskSchema.statics.getTasksCreatedToday = function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
};

// Static method to get tasks completed today
taskSchema.statics.getTasksCompletedToday = function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.countDocuments({
    completedAt: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: 'completed'
  });
};

// Static method to find tasks by user
taskSchema.statics.findByUser = function(userId) {
  return this.find({ assignedTo: userId })
    .populate('createdBy', 'username fullName email')
    .sort({ createdAt: -1 });
};

// Static method to find tasks created by user
taskSchema.statics.findCreatedByUser = function(userId) {
  return this.find({ createdBy: userId })
    .populate('assignedTo', 'username fullName email')
    .sort({ createdAt: -1 });
};

// Pre-save middleware to update overdue status
taskSchema.pre('save', function(next) {
  if (this.isModified('dueDate') || this.isModified('status')) {
    this.isOverdue = this.dueDate < new Date() && this.status !== 'completed';
  }
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Task', taskSchema);