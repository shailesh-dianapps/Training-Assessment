const Joi = require('joi');

// Generic Joi validation middleware
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    let dataToValidate;
    
    switch (source) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      default:
        dataToValidate = req.body;
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details
      });
    }

    // Replace the original data with validated and sanitized data
    if (source === 'body') req.body = value;
    if (source === 'params') req.params = value;
    if (source === 'query') req.query = value;

    next();
  };
};

// Common validation schemas
const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Page must be a positive integer'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

const searchSchema = Joi.object({
  q: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query cannot exceed 100 characters'
    })
});

// Validation middleware functions
const validateId = validate(idSchema, 'params');
const validatePagination = validate(paginationSchema, 'query');
const validateSearch = validate(searchSchema, 'query');

module.exports = {
  validate,
  validateId,
  validatePagination,
  validateSearch
};