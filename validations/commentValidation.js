const Joi = require('joi');

// Add comment validation
const addCommentValidation = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment content cannot be empty',
      'string.max': 'Comment content cannot exceed 1000 characters'
    })
});

// Update comment validation
const updateCommentValidation = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment content cannot be empty',
      'string.max': 'Comment content cannot exceed 1000 characters'
    })
});

// Like comment validation (no body needed, just route params)
const likeCommentValidation = Joi.object({});

// Reply to comment validation
const replyCommentValidation = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Reply content is required',
      'string.min': 'Reply content cannot be empty',
      'string.max': 'Reply content cannot exceed 500 characters'
    })
});

// Get comments validation (query parameters)
const getCommentsValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  sortBy: Joi.string()
    .valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'likes', '-likes')
    .default('-createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, -createdAt, updatedAt, -updatedAt, likes, -likes'
    })
});

module.exports = {
  addCommentValidation,
  updateCommentValidation,
  likeCommentValidation,
  replyCommentValidation,
  getCommentsValidation
};