const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { 
  overviewValidation, 
  userProductivityValidation, 
  taskTrendsValidation, 
  workloadDistributionValidation, 
  teamPerformanceValidation, 
  exportAnalyticsValidation 
} = require('../validations/analyticsValidation');
const Joi = require('joi');

// Route parameter validation schemas
const userIdValidation = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format'
    })
});

// All routes require authentication
router.use(authenticateToken);

// Public analytics routes (all authenticated users)
router.get('/overview', 
  validate(overviewValidation, 'query'),
  analyticsController.getOverview
);

router.get('/tasks/trending', 
  validate(taskTrendsValidation, 'query'),
  analyticsController.getTaskTrends
);

// User-specific analytics (users can see their own, managers/admins can see all)
router.get('/user/:userId', 
  validate(userIdValidation, 'params'),
  validate(userProductivityValidation, 'query'),
  (req, res, next) => {
    // Users can only see their own analytics unless they're manager/admin
    if (req.params.userId !== req.user._id.toString() && 
        !['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own analytics.'
      });
    }
    next();
  },
  analyticsController.getUserProductivity
);

// Manager/Admin only routes
router.get('/workload', 
  requireManagerOrAdmin,
  validate(workloadDistributionValidation, 'query'),
  analyticsController.getWorkloadDistribution
);

module.exports = router;