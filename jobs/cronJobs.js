const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const DailyTaskMetrics = require('../models/DailyTaskMetrics');

// Utility function to format date for logging
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Utility function to log with timestamp
const logWithTimestamp = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] CRON: ${message}`);
};

/**
 * Cron Job 1: Daily Productivity Aggregation
 * Schedule: Daily at midnight (For testing: every 2 minutes)
 * Aggregate: Tasks created, Tasks completed, Active users
 * Store in daily_task_metrics
 */
const dailyProductivityAggregation = async () => {
  try {
    logWithTimestamp('Starting daily productivity aggregation...');
    
    const today = new Date();
    const dateStr = formatDate(today);
    
    // Get tasks created today
    const tasksCreated = await Task.getTasksCreatedToday();
    
    // Get tasks completed today
    const tasksCompleted = await Task.getTasksCompletedToday();
    
    // Get active users today
    const activeUsers = await User.getActiveUsersToday();
    
    // Get additional metrics
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in_progress' });
    const overdueTasks = await Task.countDocuments({ isOverdue: true });
    
    // Calculate completion rate
    const completionRate = tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
    
    // Get tasks by priority
    const tasksByPriority = {
      low: await Task.countDocuments({ priority: 'low' }),
      medium: await Task.countDocuments({ priority: 'medium' }),
      high: await Task.countDocuments({ priority: 'high' }),
      urgent: await Task.countDocuments({ priority: 'urgent' })
    };
    
    // Get tasks by status
    const tasksByStatus = {
      pending: pendingTasks,
      in_progress: inProgressTasks,
      completed: await Task.countDocuments({ status: 'completed' }),
      cancelled: await Task.countDocuments({ status: 'cancelled' })
    };
    
    // Calculate average completion time (simplified - using hours between creation and completion)
    const completedTasksToday = await Task.find({
      completedAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      },
      status: 'completed'
    });
    
    let averageCompletionTime = 0;
    if (completedTasksToday.length > 0) {
      const totalCompletionTime = completedTasksToday.reduce((sum, task) => {
        const completionTime = (task.completedAt - task.createdAt) / (1000 * 60 * 60); // hours
        return sum + completionTime;
      }, 0);
      averageCompletionTime = totalCompletionTime / completedTasksToday.length;
    }
    
    // Create metrics object
    const metrics = {
      date: today,
      tasksCreated,
      tasksCompleted,
      activeUsers,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      tasksByPriority,
      tasksByStatus
    };
    
    // Store in database
    await DailyTaskMetrics.createOrUpdateMetrics(today, metrics);
    
    logWithTimestamp(`Aggregated metrics for ${dateStr}: Tasks Created: ${tasksCreated}, Tasks Completed: ${tasksCompleted}, Active Users: ${activeUsers}`);
    
  } catch (error) {
    logWithTimestamp(`Error in daily productivity aggregation: ${error.message}`);
    console.error(error);
  }
};

/**
 * Cron Job 2: Inactive User Detection
 * Schedule: Every hour (For testing: every 1 minute)
 * Mark users inactive if no activity in last 30 days
 */
const inactiveUserDetection = async () => {
  try {
    logWithTimestamp('Starting inactive user detection...');
    
    // Find users inactive for 30 days
    const inactiveUsers = await User.findInactiveUsers(30);
    
    let markedInactiveCount = 0;
    
    // Mark users as inactive
    for (const user of inactiveUsers) {
      await user.markInactive();
      markedInactiveCount++;
      logWithTimestamp(`Marked user ${user.email} as inactive (last activity: ${user.lastActivity})`);
    }
    
    logWithTimestamp(`Marked ${markedInactiveCount} users inactive`);
    
  } catch (error) {
    logWithTimestamp(`Error in inactive user detection: ${error.message}`);
    console.error(error);
  }
};

/**
 * Bonus Cron Job: Overdue Task Reminder
 * Identify overdue tasks and log reminder message per task
 */
const overdueTaskReminder = async () => {
  try {
    logWithTimestamp('Starting overdue task reminder check...');
    
    // Find overdue tasks
    const overdueTasks = await Task.findOverdue();
    
    if (overdueTasks.length === 0) {
      logWithTimestamp('No overdue tasks found');
      return;
    }
    
    logWithTimestamp(`Found ${overdueTasks.length} overdue tasks`);
    
    // Log reminder for each overdue task and update status
    for (const task of overdueTasks) {
      const daysOverdue = Math.ceil((new Date() - task.dueDate) / (1000 * 60 * 60 * 24));
      
      logWithTimestamp(`OVERDUE TASK REMINDER: Task "${task.title}" (ID: ${task._id}) assigned to ${task.assignedTo.name} (${task.assignedTo.email}) is ${daysOverdue} day(s) overdue. Due date: ${task.dueDate.toISOString().split('T')[0]}`);
      
      // Update the task to mark it as overdue
      await task.checkOverdue();
    }
    
  } catch (error) {
    logWithTimestamp(`Error in overdue task reminder: ${error.message}`);
    console.error(error);
  }
};

/**
 * Initialize and start all cron jobs
 */
const initializeCronJobs = () => {
  logWithTimestamp('Initializing cron jobs...');
  
  // Production schedules (commented out for testing)
  // Daily Productivity Aggregation - Daily at midnight
  // cron.schedule('0 0 * * *', dailyProductivityAggregation, {
  //   scheduled: true,
  //   timezone: "UTC"
  // });
  
  // Inactive User Detection - Every hour
  // cron.schedule('0 * * * *', inactiveUserDetection, {
  //   scheduled: true,
  //   timezone: "UTC"
  // });
  
  // Testing schedules (for development/testing)
  // Daily Productivity Aggregation - Every 2 minutes for testing
  cron.schedule('*/2 * * * *', dailyProductivityAggregation, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Inactive User Detection - Every 1 minute for testing
  cron.schedule('*/1 * * * *', inactiveUserDetection, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Overdue Task Reminder - Every 5 minutes for testing
  // In production, this could run every hour or daily
  cron.schedule('*/5 * * * *', overdueTaskReminder, {
    scheduled: true,
    timezone: "UTC"
  });
  
  logWithTimestamp('Cron jobs initialized successfully');
  logWithTimestamp('- Daily Productivity Aggregation: Every 2 minutes (testing)');
  logWithTimestamp('- Inactive User Detection: Every 1 minute (testing)');
  logWithTimestamp('- Overdue Task Reminder: Every 5 minutes (testing)');
};

/**
 * Stop all cron jobs (useful for testing or graceful shutdown)
 */
const stopCronJobs = () => {
  cron.getTasks().forEach(task => task.stop());
  logWithTimestamp('All cron jobs stopped');
};

module.exports = {
  initializeCronJobs,
  stopCronJobs,
  dailyProductivityAggregation,
  inactiveUserDetection,
  overdueTaskReminder
};