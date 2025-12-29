const Task = require('../models/Task');
const User = require('../models/User');
const TaskActivity = require('../models/TaskActivity');

// @desc    Create task (manager/admin only)
// @route   POST /api/tasks
// @access  Private (Manager/Admin)
const createTask = async (req, res) => {
  try {
    // Check authorization
    if (!['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Admin role required.'
      });
    }

    const { title, description, assignedTo, priority, dueDate, tags } = req.body;

    // Check if assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found'
      });
    }

    // Create task
    const task = new Task({
      title,
      description,
      assignedTo,
      createdBy: req.user._id,
      priority,
      dueDate,
      tags
    });

    await task.save();

    // Populate user data
    await task.populate([
      { path: 'assignedTo', select: 'username fullName email designation' },
      { path: 'createdBy', select: 'username fullName email designation' }
    ]);

    // Log activity
    await TaskActivity.logActivity({
      taskId: task._id.toString(),
      userId: req.user._id.toString(),
      action: 'created',
      details: {
        title,
        assignedTo: assignedUser.username,
        priority,
        dueDate
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all tasks with filtering and pagination (manager/admin only)
// @route   GET /api/tasks
// @access  Private (Manager/Admin)
const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Apply filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.dueDate = {};
      if (req.query.startDate) {
        query.dueDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.dueDate.$lte = new Date(req.query.endDate);
      }
    }

    // Search in title and description
    if (req.query.search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // Default sort
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      
      if (['dueDate', 'priority', 'createdAt', 'title'].includes(sortField)) {
        sortOption = { [sortField]: sortOrder };
      }
    }

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .populate('assignedTo', 'username fullName email designation')
      .populate('createdBy', 'username fullName email designation')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: page,
          totalPages,
          totalTasks: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get task by ID (manager/admin only)
// @route   GET /api/tasks/:id
// @access  Private (Manager/Admin)
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username fullName email designation')
      .populate('createdBy', 'username fullName email designation');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update task (creator or admin)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization - only creator or admin can update
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only task creator or admin can update this task.'
      });
    }

    const { title, description, assignedTo, priority, dueDate, tags, status } = req.body;
    const previousValues = { ...task.toObject() };

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) {
      // Verify assigned user exists
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
      task.assignedTo = assignedTo;
    }
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;
    if (status !== undefined) task.status = status;

    await task.save();

    // Populate user data
    await task.populate([
      { path: 'assignedTo', select: 'username fullName email designation' },
      { path: 'createdBy', select: 'username fullName email designation' }
    ]);

    // Log activity
    const changes = Object.keys(req.body);
    await TaskActivity.logActivity({
      taskId: task._id.toString(),
      userId: req.user._id.toString(),
      action: 'updated',
      details: {
        changes,
        updatedFields: req.body
      },
      metadata: {
        previousValues,
        newValues: task.toObject(),
        changes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete task (admin only)
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Log activity before deletion
    await TaskActivity.logActivity({
      taskId: task._id.toString(),
      userId: req.user._id.toString(),
      action: 'updated',
      details: {
        action: 'task_deleted',
        title: task.title
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Mark task as completed
// @route   PATCH /api/tasks/:id/complete
// @access  Private
const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user can complete this task (assigned user, creator, or admin)
    const canComplete = task.assignedTo.toString() === req.user._id.toString() ||
                       task.createdBy.toString() === req.user._id.toString() ||
                       req.user.role === 'admin';

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only complete tasks assigned to you.'
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Task is already completed'
      });
    }

    await task.markCompleted();

    // Populate user data
    await task.populate([
      { path: 'assignedTo', select: 'username fullName email designation' },
      { path: 'createdBy', select: 'username fullName email designation' }
    ]);

    // Log activity
    await TaskActivity.logActivity({
      taskId: task._id.toString(),
      userId: req.user._id.toString(),
      action: 'completed',
      details: {
        completedAt: task.completedAt,
        completedBy: req.user.username
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Task marked as completed',
      data: task
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing task',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query for user's tasks
    let query = { assignedTo: req.user._id };

    // Apply filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .populate('createdBy', 'username fullName email designation')
      .sort({ dueDate: 1, priority: -1 }) // Sort by due date, then priority
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get task statistics for the user
    const [totalAssigned, completed, pending, inProgress, overdue] = await Promise.all([
      Task.countDocuments({ assignedTo: req.user._id }),
      Task.countDocuments({ assignedTo: req.user._id, status: 'completed' }),
      Task.countDocuments({ assignedTo: req.user._id, status: 'pending' }),
      Task.countDocuments({ assignedTo: req.user._id, status: 'in_progress' }),
      Task.countDocuments({ assignedTo: req.user._id, isOverdue: true })
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: page,
          totalPages,
          totalTasks: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        statistics: {
          totalAssigned,
          completed,
          pending,
          inProgress,
          overdue,
          completionRate: totalAssigned > 0 ? ((completed / totalAssigned) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving your tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Search tasks by keyword (manager/admin only)
// @route   GET /api/tasks/search
// @access  Private (Manager/Admin)
const searchTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    let query = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } }
      ]
    };

    // Apply additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .populate('assignedTo', 'username fullName email designation')
      .populate('createdBy', 'username fullName email designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        tasks,
        searchQuery,
        pagination: {
          currentPage: page,
          totalPages,
          totalTasks: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Search tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  getMyTasks,
  searchTasks
};