const express = require('express');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validate, validateId, validatePagination } = require('../middleware/validation');
const { updateUserSchema, updateRoleSchema, getUsersQuerySchema } = require('../validations/userValidation');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  updateUserRole,
  getUserStats
} = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticateToken, requireAdmin, validate(getUsersQuerySchema, 'query'), getAllUsers);

// @route   GET /api/users/stats/overview
// @desc    Get user statistics
// @access  Private (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, getUserStats);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (own profile or admin)
router.get('/:id', authenticateToken, validateId, requireOwnershipOrAdmin(), getUserById);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (own profile or admin)
router.put('/:id', authenticateToken, validateId, validate(updateUserSchema), requireOwnershipOrAdmin(), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete - deactivate)
// @access  Private (admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateId, deleteUser);

// @route   PUT /api/users/:id/activate
// @desc    Activate user account
// @access  Private (admin only)
router.put('/:id/activate', authenticateToken, requireAdmin, validateId, activateUser);

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Private (admin only)
router.put('/:id/role', authenticateToken, requireAdmin, validateId, validate(updateRoleSchema), updateUserRole);

module.exports = router;