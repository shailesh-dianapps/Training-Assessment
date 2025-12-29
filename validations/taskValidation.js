const Joi = require('joi');

// Task creation validation (manager/admin only)
const createTaskValidation = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'Assigned user is required'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high'
    }),
  
  dueDate: Joi.alternatives()
    .try(
      Joi.date().iso().min('now').messages({
        'date.min': 'Due date must be in the future'
      }),
      Joi.string().custom((value, helpers) => {
        // Try to parse common date formats
        const formats = [
          /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        ];
        
        let parsedDate;
        
        if (formats[0].test(value)) {
          // DD/MM/YYYY format
          const [day, month, year] = value.split('/');
          parsedDate = new Date(year, month - 1, day);
        } else if (formats[1].test(value)) {
          // YYYY-MM-DD format
          parsedDate = new Date(value);
        } else if (formats[2].test(value)) {
          // DD-MM-YYYY format
          const [day, month, year] = value.split('-');
          parsedDate = new Date(year, month - 1, day);
        } else {
          return helpers.error('date.format');
        }
        
        if (isNaN(parsedDate.getTime())) {
          return helpers.error('date.invalid');
        }
        
        if (parsedDate <= new Date()) {
          return helpers.error('date.future');
        }
        
        return parsedDate;
      }, 'Date parsing')
    )
    .required()
    .messages({
      'alternatives.match': 'Due date must be in format DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, or ISO format, and must be in the future',
      'date.format': 'Due date must be in format DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY',
      'date.invalid': 'Due date must be a valid date',
      'date.future': 'Due date must be in the future',
      'any.required': 'Due date is required'
    }),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    })
});

// Task update validation (creator or admin)
const updateTaskValidation = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid user ID format'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high'
    }),
  
  status: Joi.string()
    .valid('pending', 'in_progress', 'completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, in_progress, completed'
    }),
  
  dueDate: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string().custom((value, helpers) => {
        // Try to parse common date formats
        const formats = [
          /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        ];
        
        let parsedDate;
        
        if (formats[0].test(value)) {
          // DD/MM/YYYY format
          const [day, month, year] = value.split('/');
          parsedDate = new Date(year, month - 1, day);
        } else if (formats[1].test(value)) {
          // YYYY-MM-DD format
          parsedDate = new Date(value);
        } else if (formats[2].test(value)) {
          // DD-MM-YYYY format
          const [day, month, year] = value.split('-');
          parsedDate = new Date(year, month - 1, day);
        } else {
          return helpers.error('date.format');
        }
        
        if (isNaN(parsedDate.getTime())) {
          return helpers.error('date.invalid');
        }
        
        return parsedDate;
      }, 'Date parsing')
    )
    .optional()
    .messages({
      'alternatives.match': 'Due date must be in format DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, or ISO format',
      'date.format': 'Due date must be in format DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY',
      'date.invalid': 'Due date must be a valid date'
    }),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    })
});

// Task query validation
const taskQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('dueDate', '-dueDate', 'priority', '-priority', 'createdAt', '-createdAt', 'title', '-title').default('-createdAt'),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  search: Joi.string().trim().min(1).max(100).optional(),
  q: Joi.string().trim().min(1).max(100).optional() // For search endpoint
});

// Task ID validation
const taskIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid task ID format',
      'any.required': 'Task ID is required'
    })
});

// Metrics query validation
const getMetricsQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  limit: Joi.number().integer().min(1).max(365).default(30)
});

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  taskQueryValidation,
  taskIdValidation,
  getMetricsQuerySchema
};