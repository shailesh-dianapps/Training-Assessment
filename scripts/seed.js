const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Task = require('../models/Task');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    fullName: 'System Administrator',
    designation: 'System Admin',
    role: 'admin'
  },
  {
    username: 'manager1',
    email: 'manager@example.com',
    password: 'manager123',
    fullName: 'Project Manager',
    designation: 'Senior Project Manager',
    role: 'manager'
  },
  {
    username: 'developer1',
    email: 'dev1@example.com',
    password: 'dev123',
    fullName: 'John Developer',
    designation: 'Software Developer',
    role: 'user'
  },
  {
    username: 'developer2',
    email: 'dev2@example.com',
    password: 'dev123',
    fullName: 'Jane Developer',
    designation: 'Frontend Developer',
    role: 'user'
  },
  {
    username: 'tester1',
    email: 'tester@example.com',
    password: 'test123',
    fullName: 'Alice Tester',
    designation: 'QA Engineer',
    role: 'user'
  }
];

const sampleTasks = [
  {
    title: 'Implement User Authentication System',
    description: 'Develop JWT-based authentication with role-based access control for the task management platform',
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    tags: ['authentication', 'security', 'backend']
  },
  {
    title: 'Design Database Schema',
    description: 'Create MongoDB schema for tasks, users, and comments with proper indexing',
    priority: 'high',
    status: 'completed',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    tags: ['database', 'design', 'mongodb']
  },
  {
    title: 'Create Task Management API',
    description: 'Build RESTful API endpoints for task CRUD operations with proper validation',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    tags: ['api', 'rest', 'crud']
  },
  {
    title: 'Implement Comment System',
    description: 'Add commenting functionality to tasks with replies and likes',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    tags: ['comments', 'social', 'engagement']
  },
  {
    title: 'Setup Analytics Dashboard',
    description: 'Create productivity analytics and reporting features for managers',
    priority: 'low',
    status: 'pending',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    tags: ['analytics', 'dashboard', 'reporting']
  },
  {
    title: 'Write API Documentation',
    description: 'Document all API endpoints with examples and response formats',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
    tags: ['documentation', 'api', 'examples']
  },
  {
    title: 'Setup Automated Testing',
    description: 'Implement unit and integration tests for all API endpoints',
    priority: 'high',
    status: 'pending',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    tags: ['testing', 'automation', 'quality']
  },
  {
    title: 'Optimize Database Queries',
    description: 'Review and optimize MongoDB queries for better performance',
    priority: 'low',
    status: 'completed',
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    tags: ['optimization', 'performance', 'database']
  }
];

// Seed functions
const seedUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('Cleared existing users');

    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }

    console.log(`Created ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedTasks = async (users) => {
  try {
    await Task.deleteMany({});
    console.log('Cleared existing tasks');

    const tasks = [];
    const managerUser = users.find(user => user.role === 'manager');
    const regularUsers = users.filter(user => user.role === 'user');

    for (let i = 0; i < sampleTasks.length; i++) {
      const taskData = sampleTasks[i];
      // Assign tasks to different users
      const assignedUser = regularUsers[i % regularUsers.length];
      
      const task = new Task({
        ...taskData,
        assignedTo: assignedUser._id,
        createdBy: managerUser._id
      });
      await task.save();
      tasks.push(task);
    }

    console.log(`Created ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error('Error seeding tasks:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Starting database seeding...');

    const users = await seedUsers();
    const tasks = await seedTasks(users);

    console.log('\n=== Seeding completed successfully! ===');
    console.log(`Created ${users.length} users`);
    console.log(`Created ${tasks.length} tasks`);
    
    console.log('\nSample login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('Developer 1: dev1@example.com / dev123');
    console.log('Developer 2: dev2@example.com / dev123');
    console.log('Tester: tester@example.com / test123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };