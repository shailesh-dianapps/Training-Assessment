const DailyTaskMetrics = require('../models/DailyTaskMetrics');

// @desc    Get daily task metrics
// @route   GET /api/metrics/daily
// @access  Private (admin only)
const getDailyMetrics = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Date range filter
    let query = {};
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    const metrics = await DailyTaskMetrics.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DailyTaskMetrics.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      message: 'Daily metrics retrieved successfully',
      metrics,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get daily metrics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve daily metrics',
      message: 'Internal server error'
    });
  }
};

// @desc    Get metrics for specific date
// @route   GET /api/metrics/daily/:date
// @access  Private (admin only)
const getMetricsByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const metrics = await DailyTaskMetrics.findOne({ date });

    if (!metrics) {
      return res.status(404).json({
        error: 'Metrics not found',
        message: 'No metrics found for the specified date'
      });
    }

    res.json({
      message: 'Metrics retrieved successfully',
      metrics
    });
  } catch (error) {
    console.error('Get metrics by date error:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: 'Internal server error'
    });
  }
};

// @desc    Get metrics summary for date range
// @route   GET /api/metrics/summary
// @access  Private (admin only)
const getMetricsSummary = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Higher default for summary
    const skip = (page - 1) * limit;

    // Date range parameters
    let startDate, endDate;
    
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    } else {
      const days = parseInt(req.query.days) || 30;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Build query for date range
    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Get paginated metrics
    const metrics = await DailyTaskMetrics.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await DailyTaskMetrics.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get all metrics for summary calculations (without pagination)
    const allMetrics = await DailyTaskMetrics.find(query).sort({ date: -1 });

    if (allMetrics.length === 0) {
      return res.json({
        message: 'No metrics found for the specified range',
        summary: {
          totalDays: 0,
          averageTasksCreated: 0,
          averageTasksCompleted: 0,
          averageActiveUsers: 0,
          averageCompletionRate: 0,
          totalTasksCreated: 0,
          totalTasksCompleted: 0
        },
        dailyMetrics: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Calculate summary statistics from all metrics (not just paginated ones)
    const totalDays = allMetrics.length;
    const totalTasksCreated = allMetrics.reduce((sum, m) => sum + m.tasksCreated, 0);
    const totalTasksCompleted = allMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0);
    const totalActiveUsers = allMetrics.reduce((sum, m) => sum + m.activeUsers, 0);
    const totalCompletionRate = allMetrics.reduce((sum, m) => sum + m.completionRate, 0);

    const summary = {
      totalDays,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      averageTasksCreated: Math.round((totalTasksCreated / totalDays) * 100) / 100,
      averageTasksCompleted: Math.round((totalTasksCompleted / totalDays) * 100) / 100,
      averageActiveUsers: Math.round((totalActiveUsers / totalDays) * 100) / 100,
      averageCompletionRate: Math.round((totalCompletionRate / totalDays) * 100) / 100,
      totalTasksCreated,
      totalTasksCompleted,
      overallCompletionRate: totalTasksCreated > 0 ? 
        Math.round((totalTasksCompleted / totalTasksCreated) * 100 * 100) / 100 : 0
    };

    res.json({
      message: 'Metrics summary retrieved successfully',
      summary,
      dailyMetrics: metrics, // Return paginated metrics
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get metrics summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics summary',
      message: 'Internal server error'
    });
  }
};

// @desc    Trigger manual metrics aggregation
// @route   POST /api/metrics/aggregate
// @access  Private (admin only)
const triggerMetricsAggregation = async (req, res) => {
  try {
    // Import the cron job function
    const { dailyProductivityAggregation } = require('../jobs/cronJobs');
    
    // Run the aggregation
    await dailyProductivityAggregation();

    res.json({
      message: 'Metrics aggregation completed successfully'
    });
  } catch (error) {
    console.error('Manual metrics aggregation error:', error);
    res.status(500).json({
      error: 'Failed to aggregate metrics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getDailyMetrics,
  getMetricsByDate,
  getMetricsSummary,
  triggerMetricsAggregation
};