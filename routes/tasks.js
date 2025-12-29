const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const { authenticateToken, requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  createTaskValidation,
  updateTaskValidation,
  taskQueryValidation,
  taskIdValidation
} = require('../validations/taskValidation');
const {
  addCommentValidation,
  getCommentsValidation
} = require('../validations/commentValidation');

// Create taskId validation for comment routes
const Joi = require('joi');
const taskIdParamValidation = Joi.object({
  taskId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid task ID format',
      'any.required': 'Task ID is required'
    })
});

// All routes require authentication
router.use(authenticateToken);

// Task management routes
router.post('/', 
  requireManagerOrAdmin,
  validate(createTaskValidation), 
  taskController.createTask
);

router.get('/', 
  requireManagerOrAdmin,
  validate(taskQueryValidation, 'query'), 
  taskController.getAllTasks
);

router.get('/my-tasks', 
  validate(taskQueryValidation, 'query'), 
  taskController.getMyTasks
);

router.get('/search', 
  requireManagerOrAdmin,
  validate(taskQueryValidation, 'query'), 
  taskController.searchTasks
);

router.get('/:id', 
  requireManagerOrAdmin,
  validate(taskIdValidation, 'params'), 
  taskController.getTaskById
);

router.put('/:id', 
  validate(taskIdValidation, 'params'),
  validate(updateTaskValidation), 
  taskController.updateTask
);

router.delete('/:id', 
  requireAdmin,
  validate(taskIdValidation, 'params'), 
  taskController.deleteTask
);

router.patch('/:id/complete', 
  validate(taskIdValidation, 'params'), 
  taskController.completeTask
);

// Task comment routes (nested under tasks)
router.post('/:taskId/comments', 
  validate(taskIdParamValidation, 'params'),
  validate(addCommentValidation), 
  commentController.addComment
);

router.get('/:taskId/comments', 
  validate(taskIdParamValidation, 'params'),
  validate(getCommentsValidation, 'query'),
  commentController.getTaskComments
);

module.exports = router;