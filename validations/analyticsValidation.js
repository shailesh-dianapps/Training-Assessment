const Joi = require('joi');

// Analytics overview validation (no body, just query params)
const overviewValidation = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'Start date must be a valid date'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date'
    }),
  
  timeframe: Joi.string()
    .valid('today', 'week', 'month', 'quarter', 'year', 'all')
    .default('month')
    .messages({
      'any.only': 'Timeframe must be one of: today, week, month, quarter, year, all'
    })
});

// User productivity validation
const userProductivityValidation = Joi.object({
  timeframe: Joi.string()
    .valid('week', 'month', 'quarter', 'year')
    .default('month')
    .messages({
      'any.only': 'Timeframe must be one of: week, month, quarter, year'
    }),
  
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'Start date must be a valid date'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date'
    }),
  
  includeInactive: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Include inactive must be a boolean value'
    })
});

// Task trends validation
const taskTrendsValidation = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(7)
    .messages({
      'number.base': 'Days must be a number',
      'number.integer': 'Days must be an integer',
      'number.min': 'Days must be at least 1',
      'number.max': 'Days cannot exceed 365'
    }),
  
  groupBy: Joi.string()
    .valid('day', 'week', 'month')
    .default('day')
    .messages({
      'any.only': 'Group by must be one of: day, week, month'
    }),
  
  includeWeekends: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Include weekends must be a boolean value'
    })
});

// Workload distribution validation (Manager/Admin only)
const workloadDistributionValidation = Joi.object({
  timeframe: Joi.string()
    .valid('current', 'week', 'month', 'quarter')
    .default('current')
    .messages({
      'any.only': 'Timeframe must be one of: current, week, month, quarter'
    }),
  
  teamId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Team ID must be a valid MongoDB ObjectId'
    }),
  
  includeCompleted: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Include completed must be a boolean value'
    }),
  
  sortBy: Joi.string()
    .valid('workload', 'completion_rate', 'overdue_tasks', 'user_name')
    .default('workload')
    .messages({
      'any.only': 'Sort by must be one of: workload, completion_rate, overdue_tasks, user_name'
    })
});

// Team performance validation (Manager/Admin only)
const teamPerformanceValidation = Joi.object({
  timeframe: Joi.string()
    .valid('week', 'month', 'quarter', 'year')
    .default('month')
    .messages({
      'any.only': 'Timeframe must be one of: week, month, quarter, year'
    }),
  
  metrics: Joi.array()
    .items(Joi.string().valid('completion_rate', 'average_time', 'task_count', 'quality_score'))
    .default(['completion_rate', 'task_count'])
    .messages({
      'array.base': 'Metrics must be an array',
      'any.only': 'Each metric must be one of: completion_rate, average_time, task_count, quality_score'
    }),
  
  compareWith: Joi.string()
    .valid('previous_period', 'same_period_last_year', 'none')
    .default('previous_period')
    .messages({
      'any.only': 'Compare with must be one of: previous_period, same_period_last_year, none'
    })
});

// Export analytics validation (Admin only)
const exportAnalyticsValidation = Joi.object({
  format: Joi.string()
    .valid('json', 'csv', 'excel')
    .default('json')
    .messages({
      'any.only': 'Format must be one of: json, csv, excel'
    }),
  
  reportType: Joi.string()
    .valid('overview', 'user_productivity', 'task_trends', 'workload_distribution', 'team_performance')
    .required()
    .messages({
      'any.only': 'Report type must be one of: overview, user_productivity, task_trends, workload_distribution, team_performance',
      'any.required': 'Report type is required'
    }),
  
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date',
      'any.required': 'End date is required'
    }),
  
  includeDetails: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Include details must be a boolean value'
    })
});

module.exports = {
  overviewValidation,
  userProductivityValidation,
  taskTrendsValidation,
  workloadDistributionValidation,
  teamPerformanceValidation,
  exportAnalyticsValidation
};