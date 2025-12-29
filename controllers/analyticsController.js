const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const TaskActivity = require('../models/TaskActivity');
const DailyTaskMetrics = require('../models/DailyTaskMetrics');
const mongoose = require('mongoose');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getOverview = async (req, res) => {
  try {
    const [
      totalTasks,
      completedTasks,
      activeUsers,
      totalUsers,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      totalComments
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      User.countDocuments({ isActive: true, isInactive: false }),
      User.countDocuments(),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'in_progress' }),
      Task.countDocuments({ isOverdue: true }),
      Comment.countDocuments()
    ]);

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

    // Get today's metrics
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      tasksCreatedToday,
      tasksCompletedToday,
      activeUsersToday,
      commentsToday
    ] = await Promise.all([
      Task.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      Task.countDocuments({
        completedAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      User.getActiveUsersToday(),
      Comment.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          activeUsers,
          completionRate: parseFloat(completionRate)
        },
        taskBreakdown: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasks
        },
        todayMetrics: {
          tasksCreated: tasksCreatedToday,
          tasksCompleted: tasksCompletedToday,
          activeUsers: activeUsersToday,
          comments: commentsToday
        },
        userMetrics: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        engagement: {
          totalComments,
          averageCommentsPerTask: totalTasks > 0 ? (totalComments / totalTasks).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics overview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user productivity analytics
// @route   GET /api/analytics/user/:userId
// @access  Private
const getUserProductivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const timeframe = req.query.timeframe || 'month'; // week, month, quarter, year

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate date range
    let startDate;
    const now = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      tasksAssigned,
      tasksCompleted,
      tasksCreated,
      averageCompletionTime,
      tasksByPriority,
      tasksByStatus,
      activityStats,
      commentsCount
    ] = await Promise.all([
      Task.countDocuments({
        assignedTo: userId,
        createdAt: { $gte: startDate }
      }),
      Task.countDocuments({
        assignedTo: userId,
        status: 'completed',
        completedAt: { $gte: startDate }
      }),
      Task.countDocuments({
        createdBy: userId,
        createdAt: { $gte: startDate }
      }),
      Task.aggregate([
        {
          $match: {
            assignedTo: mongoose.Types.ObjectId(userId),
            status: 'completed',
            completedAt: { $gte: startDate }
          }
        },
        {
          $project: {
            completionTime: {
              $subtract: ['$completedAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$completionTime' }
          }
        }
      ]),
      Task.aggregate([
        {
          $match: {
            assignedTo: mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]),
      Task.aggregate([
        {
          $match: {
            assignedTo: mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      TaskActivity.getUserActivity(userId.toString(), { action: null }),
      Comment.countDocuments({
        userId,
        createdAt: { $gte: startDate }
      })
    ]);

    const completionRate = tasksAssigned > 0 ? ((tasksCompleted / tasksAssigned) * 100).toFixed(2) : 0;
    const avgCompletionDays = averageCompletionTime[0]?.avgTime 
      ? (averageCompletionTime[0].avgTime / (1000 * 60 * 60 * 24)).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          designation: user.designation
        },
        timeframe,
        productivity: {
          tasksAssigned,
          tasksCompleted,
          tasksCreated,
          completionRate: parseFloat(completionRate),
          averageCompletionDays: parseFloat(avgCompletionDays),
          commentsCount
        },
        breakdown: {
          byPriority: tasksByPriority,
          byStatus: tasksByStatus
        },
        activityLevel: activityStats.length
      }
    });
  } catch (error) {
    console.error('Get user productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user productivity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get task trends
// @route   GET /api/analytics/tasks/trending
// @access  Private
const getTaskTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily task creation and completion trends
    const trends = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          tasksCreated: { $sum: 1 },
          tasksCompleted: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get most active tasks (by comments)
    const mostActiveTasks = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$taskId',
          commentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: '_id',
          as: 'task'
        }
      },
      {
        $unwind: '$task'
      },
      {
        $project: {
          taskId: '$_id',
          title: '$task.title',
          status: '$task.status',
          priority: '$task.priority',
          commentCount: 1
        }
      },
      {
        $sort: { commentCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get priority distribution trends
    const priorityTrends = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            priority: '$priority'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        timeframe: `Last ${days} days`,
        dailyTrends: trends,
        mostActiveTasks,
        priorityTrends
      }
    });
  } catch (error) {
    console.error('Get task trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task trends',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get workload distribution
// @route   GET /api/analytics/workload
// @access  Private (Manager/Admin)
const getWorkloadDistribution = async (req, res) => {
  try {
    // Check authorization
    if (!['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Admin role required.'
      });
    }

    const timeframe = req.query.timeframe || 'current'; // current, week, month

    let matchCondition = {};
    if (timeframe !== 'current') {
      let startDate;
      const now = new Date();
      
      if (timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      if (startDate) {
        matchCondition.createdAt = { $gte: startDate };
      }
    }

    // Get workload by user
    const workloadByUser = await Task.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: { $cond: ['$isOverdue', 1, 0] }
          },
          highPriorityTasks: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
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
          userId: '$_id',
          username: '$user.username',
          fullName: '$user.fullName',
          designation: '$user.designation',
          totalTasks: 1,
          completedTasks: 1,
          pendingTasks: 1,
          inProgressTasks: 1,
          overdueTasks: 1,
          highPriorityTasks: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { totalTasks: -1 }
      }
    ]);

    // Get overall statistics
    const overallStats = await Task.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          avgTasksPerUser: { $avg: 1 },
          maxTasksPerUser: { $max: 1 },
          minTasksPerUser: { $min: 1 }
        }
      }
    ]);

    // Calculate workload balance metrics
    const taskCounts = workloadByUser.map(user => user.totalTasks);
    const avgTasks = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
    const variance = taskCounts.reduce((acc, count) => acc + Math.pow(count - avgTasks, 2), 0) / taskCounts.length;
    const standardDeviation = Math.sqrt(variance);
    const balanceScore = standardDeviation / avgTasks; // Lower is better

    res.json({
      success: true,
      data: {
        timeframe,
        workloadByUser,
        statistics: {
          totalUsers: workloadByUser.length,
          averageTasksPerUser: avgTasks.toFixed(1),
          workloadBalance: {
            standardDeviation: standardDeviation.toFixed(2),
            balanceScore: balanceScore.toFixed(2),
            interpretation: balanceScore < 0.5 ? 'Well balanced' : 
                           balanceScore < 1.0 ? 'Moderately balanced' : 'Poorly balanced'
          }
        }
      }
    });
  } catch (error) {
    console.error('Get workload distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workload distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getOverview,
  getUserProductivity,
  getTaskTrends,
  getWorkloadDistribution
};