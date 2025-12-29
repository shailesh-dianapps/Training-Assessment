const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
  // Create a new user
  async createUser(userData) {
    try {
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = new User(userData);
      await user.save();
      
      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findByEmail(email);
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  async getAllUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-createdAt',
        role,
        isActive,
        search
      } = options;

      const query = {};
      
      if (role) query.role = role;
      if (typeof isActive === 'boolean') query.isActive = isActive;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password, role, ...allowedUpdates } = updateData;
      
      const user = await User.findByIdAndUpdate(
        userId,
        allowedUpdates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user password
  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Delete user (soft delete by setting isActive to false)
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user role (admin only)
  async updateUserRole(userId, newRole) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers,
        recentUsers
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ isInactive: true }),
        User.countDocuments({
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        })
      ]);

      return {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers,
        recentUsers,
        userGrowth: {
          last30Days: recentUsers
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Find inactive users
  async findInactiveUsers(days = 30) {
    try {
      return await User.findInactiveUsers(days);
    } catch (error) {
      throw error;
    }
  }

  // Mark users as inactive
  async markUsersInactive(userIds) {
    try {
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { 
          isInactive: true,
          inactiveSince: new Date()
        }
      );

      return {
        modifiedCount: result.modifiedCount,
        message: `Marked ${result.modifiedCount} users as inactive`
      };
    } catch (error) {
      throw error;
    }
  }

  // Get active users count for today
  async getActiveUsersToday() {
    try {
      return await User.getActiveUsersToday();
    } catch (error) {
      throw error;
    }
  }

  // Update user activity
  async updateUserActivity(userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        await user.updateLastActivity();
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();