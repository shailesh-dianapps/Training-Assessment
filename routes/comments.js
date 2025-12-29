const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { 
  addCommentValidation, 
  updateCommentValidation, 
  likeCommentValidation, 
  replyCommentValidation, 
  getCommentsValidation 
} = require('../validations/commentValidation');
const Joi = require('joi');

// Route parameter validation schemas
const commentIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid comment ID format'
    })
});

const taskIdValidation = Joi.object({
  taskId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid task ID format'
    })
});

// All routes require authentication
router.use(authenticateToken);

// Task comment routes
router.post('/task/:taskId', 
  validate(taskIdValidation, 'params'),
  validate(addCommentValidation), 
  commentController.addComment
);

router.get('/task/:taskId', 
  validate(taskIdValidation, 'params'),
  validate(getCommentsValidation, 'query'),
  commentController.getTaskComments
);

// Comment management routes
router.put('/:id', 
  validate(commentIdValidation, 'params'),
  validate(updateCommentValidation), 
  commentController.updateComment
);

router.delete('/:id', 
  validate(commentIdValidation, 'params'),
  commentController.deleteComment
);

router.post('/:id/like', 
  validate(commentIdValidation, 'params'),
  validate(likeCommentValidation),
  commentController.toggleCommentLike
);

router.post('/:id/reply', 
  validate(commentIdValidation, 'params'),
  validate(replyCommentValidation), 
  commentController.addReply
);

module.exports = router;