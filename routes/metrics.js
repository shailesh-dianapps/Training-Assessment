const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, validateId } = require('../middleware/validation');
const { getMetricsQuerySchema } = require('../validations/taskValidation');
const {
  getDailyMetrics,
  getMetricsByDate,
  getMetricsSummary,
  triggerMetricsAggregation
} = require('../controllers/metricsController');

const router = express.Router();

// @route   GET /api/metrics/summary
// @desc    Get metrics summary for date range
// @access  Private (admin only)
router.get('/summary', authenticateToken, requireAdmin, validate(getMetricsQuerySchema, 'query'), getMetricsSummary);

// @route   POST /api/metrics/aggregate
// @desc    Trigger manual metrics aggregation
// @access  Private (admin only)
router.post('/aggregate', authenticateToken, requireAdmin, triggerMetricsAggregation);

// @route   GET /api/metrics/daily
// @desc    Get daily task metrics
// @access  Private (admin only)
router.get('/daily', authenticateToken, requireAdmin, validate(getMetricsQuerySchema, 'query'), getDailyMetrics);

// @route   GET /api/metrics/daily/:date
// @desc    Get metrics for specific date (YYYY-MM-DD format)
// @access  Private (admin only)
router.get('/daily/:date', authenticateToken, requireAdmin, getMetricsByDate);

module.exports = router;