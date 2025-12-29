const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
commentSchema.index({ taskId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ createdAt: -1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Instance method to add like
commentSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Instance method to add reply
commentSchema.methods.addReply = function(userId, content) {
  this.replies.push({
    user: userId,
    content: content
  });
  return this.save();
};

// Instance method to edit comment
commentSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Static method to find comments by task
commentSchema.statics.findByTask = function(taskId, options = {}) {
  const { page = 1, limit = 20, sort = 'createdAt' } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ taskId })
    .populate('userId', 'username fullName avatar')
    .populate('replies.user', 'username fullName avatar')
    .populate('likes.user', 'username fullName')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to find comments by user
commentSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .populate('taskId', 'title status')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get comment statistics
commentSchema.statics.getCommentStats = async function() {
  const totalComments = await this.countDocuments();
  const commentsToday = await this.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  
  const topCommenters = await this.aggregate([
    {
      $group: {
        _id: '$userId',
        commentCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        username: '$user.username',
        fullName: '$user.fullName',
        commentCount: 1
      }
    },
    {
      $sort: { commentCount: -1 }
    },
    {
      $limit: 5
    }
  ]);
  
  return {
    totalComments,
    commentsToday,
    topCommenters
  };
};

module.exports = mongoose.model('Comment', commentSchema);