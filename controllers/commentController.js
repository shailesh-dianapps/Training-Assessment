const Comment = require('../models/Comment');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');

// @desc    Add comment to task
// @route   POST /api/tasks/:taskId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Create comment
    const comment = new Comment({
      taskId,
      userId,
      content
    });

    await comment.save();

    // Populate user data
    await comment.populate('userId', 'username fullName avatar');

    // Log activity
    await TaskActivity.logActivity({
      taskId: taskId.toString(),
      userId: userId.toString(),
      action: 'commented',
      details: {
        commentId: comment._id,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comments = await Comment.findByTask(taskId, { page, limit });
    const total = await Comment.countDocuments({ taskId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (owner only)
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment
    await comment.editContent(content);
    await comment.populate('userId', 'username fullName avatar');

    // Log activity
    await TaskActivity.logActivity({
      taskId: comment.taskId.toString(),
      userId: userId.toString(),
      action: 'updated',
      details: {
        commentId: comment._id,
        action: 'comment_edited'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (owner or admin)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (comment.userId.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Log activity before deletion
    await TaskActivity.logActivity({
      taskId: comment.taskId.toString(),
      userId: userId.toString(),
      action: 'updated',
      details: {
        commentId: comment._id,
        action: 'comment_deleted'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await Comment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
const toggleCommentLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const existingLike = comment.likes.find(like => like.user.toString() === userId.toString());
    
    if (existingLike) {
      await comment.removeLike(userId);
      res.json({
        success: true,
        message: 'Comment unliked',
        data: { liked: false, likeCount: comment.likeCount }
      });
    } else {
      await comment.addLike(userId);
      res.json({
        success: true,
        message: 'Comment liked',
        data: { liked: true, likeCount: comment.likeCount }
      });
    }
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling comment like',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Add reply to comment
// @route   POST /api/comments/:id/reply
// @access  Private
const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.addReply(userId, content);
    await comment.populate('replies.user', 'username fullName avatar');

    // Log activity
    await TaskActivity.logActivity({
      taskId: comment.taskId.toString(),
      userId: userId.toString(),
      action: 'commented',
      details: {
        commentId: comment._id,
        action: 'reply_added',
        content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: comment
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reply',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  addComment,
  getTaskComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
  addReply
};