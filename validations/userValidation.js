const Joi = require('joi');

// User update validation schema
const updateUserSchema = Joi.object({
  username: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),
  
  fullName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters'
    }),
  
  designation: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Designation cannot exceed 100 characters'
    }),
  
  avatar: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Avatar must be a valid URL'
    })
});

// User role update validation schema
const updateRoleSchema = Joi.object({
  role: Joi.string()
    .valid('user', 'manager', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be one of: user, manager, admin',
      'any.required': 'Role is required'
    })
});

// Query parameters validation for getting users
const getUsersQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .messages({
      'number.min': 'Page must be a positive integer'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  role: Joi.string()
    .valid('user', 'manager', 'admin')
    .optional()
    .messages({
      'any.only': 'Role must be one of: user, manager, admin'
    }),
  
  isActive: Joi.string()
    .valid('true', 'false')
    .optional(),
  
  search: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query cannot exceed 100 characters'
    })
});

module.exports = {
  updateUserSchema,
  updateRoleSchema,
  getUsersQuerySchema
};