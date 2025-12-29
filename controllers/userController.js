const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: 'Internal server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (own profile or admin)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist'
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (own profile or admin)
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, avatar } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          error: 'Update failed',
          message: 'Email is already in use'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Update failed',
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to update user',
      message: 'Internal server error'
    });
  }
};

// @desc    Delete user (soft delete - deactivate)
// @route   DELETE /api/users/:id
// @access  Private (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Delete failed',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Internal server error'
    });
  }
};

// @desc    Activate user account
// @route   PUT /api/users/:id/activate
// @access  Private (admin only)
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      error: 'Failed to activate user',
      message: 'Internal server error'
    });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be either "user" or "admin"'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Role change failed',
        message: 'You cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: 'Internal server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (admin only)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: adminUsers,
        regularUsers: totalUsers - adminUsers,
        recentRegistrations: recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user statistics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  updateUserRole,
  getUserStats
};