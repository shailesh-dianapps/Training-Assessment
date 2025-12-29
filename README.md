# Task Management & Productivity Analytics Platform

A production-grade RESTful backend system built with Node.js, Express.js, and MongoDB where teams can create, assign, track, and complete tasks while generating productivity insights using Analytics APIs and Cron jobs.

## 🚀 Features

### Part 1: User Authentication & Management (60 Minutes)
- **JWT Authentication** with 24-hour token expiry
- **Session Management** with device tracking and token storage
- **Forgot Password Flow** with OTP verification (6-digit OTP, 10-minute expiry)
- **OTP Email Simulation** (logged to console in development mode)
- **Role-based Access Control** (user, manager, admin)
- **Password Security** with bcrypt hashing (minimum 10 salt rounds)
- **User Profile Management** with avatar support
- **Email format validation** and request body sanitization
- **Middleware-based protected routes**
- **Multi-device session tracking** with logout from all devices

### Part 2: Task Management (70 Minutes)
- **CRUD Operations** for tasks with role-based permissions
- **Task Creation** (manager/admin only)
- **Task Assignment** and status tracking (pending, in_progress, completed)
- **Priority Levels** (low, medium, high)
- **Due Date Management** with overdue detection
- **Task Filtering** by status, priority, assignedTo
- **Sorting** by dueDate, priority, createdAt
- **Pagination** using page and limit

### Part 3: Comments & Activity Tracking (40 Minutes)
- **Task Comments** with CRUD operations
- **Activity Logging** for all user actions (created, updated, completed, commented)
- **IP Address and User Agent tracking**
- **Comment ownership** (owner/admin can modify)

### Part 4: Productivity Analytics (50 Minutes)
- **Overview Dashboard** with total tasks, completed tasks, active users
- **User Productivity Analytics** with completion rates
- **Task Trending Analysis** for most active tasks in last 7 days
- **Analytics Collections**: task_activity and daily_task_metrics

### Part 5: Cron Jobs (30 Minutes)
- **Daily Productivity Aggregation** (midnight daily, 2min for testing)
- **Inactive User Detection** (hourly, 1min for testing)
- **Overdue Task Reminder** (bonus feature, 5min for testing)

### Part 6: Advanced Features (20 Minutes)
- **Rate Limiting** (100 requests / 15 minutes / IP)
- **Security Headers** via Helmet middleware
- **CORS Protection** with configurable origins
- **Input Validation** using Joi schemas

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Scheduling**: node-cron
- **Password Hashing**: bcrypt

## 📋 API Endpoints

### Authentication APIs
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and return JWT token
- `POST /api/auth/logout` - Logout and invalidate current session
- `POST /api/auth/logout-all` - Logout from all devices
- `GET /api/auth/me` - Get logged-in user profile
- `PUT /api/auth/profile` - Update user profile (no password)
- `POST /api/auth/forgot-password` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP and get reset token
- `POST /api/auth/reset-password` - Reset password with JWT token

### Task Management APIs
- `POST /api/tasks` - Create task (manager/admin only)
- `GET /api/tasks` - List tasks (pagination supported)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task (creator/admin)
- `DELETE /api/tasks/:id` - Delete task (admin only)
- `PATCH /api/tasks/:id/complete` - Mark task completed
- `GET /api/tasks/my-tasks` - Tasks assigned to current user

### Comments & Activity APIs
- `POST /api/tasks/:taskId/comments` - Add comment
- `GET /api/tasks/:taskId/comments` - List comments
- `PUT /api/comments/:id` - Update comment (owner only)
- `DELETE /api/comments/:id` - Delete comment (owner/admin)

### Analytics APIs
- `GET /api/analytics/overview` - Total tasks, completed tasks, active users
- `GET /api/analytics/user/:userId` - User productivity, completion rate
- `GET /api/analytics/tasks/trending` - Most active tasks in the last 7 days

### Metrics APIs (Admin Only)
- `GET /api/metrics/daily` - Get daily task metrics with pagination
- `GET /api/metrics/daily/:date` - Get metrics for specific date
- `GET /api/metrics/summary` - Get metrics summary with date range
- `POST /api/metrics/aggregate` - Trigger manual metrics aggregation

### User Management APIs (Admin Only)
- `GET /api/users` - Get all users with filtering and pagination
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Deactivate user
- `PUT /api/users/:id/activate` - Activate user
- `GET /api/users/stats/overview` - Get user statistics overview

## 🏗 Project Structure

```
src/
├── config/
│   └── db.js                 # Database connection
├── models/
│   ├── User.js              # User schema
│   ├── Task.js              # Task schema
│   ├── Comment.js           # Comment schema
│   ├── Session.js           # Session management schema
│   ├── OTP.js               # OTP verification schema
│   ├── TaskActivity.js      # Activity logging schema
│   └── DailyTaskMetrics.js  # Daily metrics schema
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── taskController.js     # Task operations
│   ├── commentController.js  # Comment management
│   ├── analyticsController.js # Analytics & reporting
│   └── metricsController.js  # Metrics management
├── routes/
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   ├── tasks.js             # Task routes
│   ├── comments.js          # Comment routes
│   ├── analytics.js         # Analytics routes
│   └── metrics.js           # Metrics routes
├── middleware/
│   ├── auth.js              # Authentication & authorization
│   └── validation.js        # Request validation
├── validations/
│   ├── authValidation.js    # Auth validation schemas
│   ├── userValidation.js    # User validation schemas
│   └── taskValidation.js    # Task validation schemas
├── jobs/
│   └── cronJobs.js          # Scheduled jobs (cron)
├── scripts/
│   └── seed.js              # Database seeding
├── utils/
│   └── helpers.js           # Utility functions
└── server.js                # Application entry point (app.js)
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Environment Configuration
   NODE_ENV=development
   PORT=8000
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/final_assessment
   
   # JWT Configuration
   JWT_SECRET=g49b9136r34ae343f55c65b0jg6f403c522472a63b5e0e2a3439b5hyb532057e
   JWT_EXPIRES_IN=24h
   
   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   
   # API Configuration
   API_VERSION=v1
   BASE_URL=http://localhost:8000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:8000`

**Note**: In development mode, OTPs for forgot password are logged to the console for testing purposes.

## 🧪 Testing the API

The platform includes comprehensive testing suites to ensure API reliability and functionality.

### Unit Testing with Jest

**Test Suites Available:**
- **Authentication Tests** - Registration, login, logout, password management
- **Task Management Tests** - CRUD operations, assignments, status management  
- **Comments Tests** - Comments, likes, replies, activity tracking
- **Analytics Tests** - Overview, user productivity, trends, workload distribution
- **Metrics Tests** - Daily metrics, summaries, manual aggregation
- **User Management Tests** - User CRUD, role management, statistics

**Running Tests:**
```bash
# Install test dependencies
npm install --save-dev jest supertest mongodb-memory-server

# Run all tests
npm test

# Run specific test suite
npm test -- --testPathPattern=auth.test.js

# Run tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run comprehensive test runner
node tests/run-tests.js
```

### cURL Testing Script

**Comprehensive API testing with real HTTP requests:**
```bash
# Make script executable
chmod +x tests/curl-tests.sh

# Run all cURL tests (requires server to be running)
./tests/curl-tests.sh

# Prerequisites: curl and jq must be installed
# Ubuntu: sudo apt-get install curl jq
# macOS: brew install curl jq
```

**The cURL script tests:**
- All authentication flows (register, login, profile management)
- Task management operations (create, read, update, delete, complete)
- Comments and activity tracking (add, update, like, reply, delete)
- Analytics endpoints (overview, user productivity, trends, workload)
- Metrics APIs (daily metrics, summaries, aggregation)
- User management (CRUD operations, role updates, statistics)
- Error scenarios (invalid tokens, unauthorized access, validation errors)

### Sample User Accounts (after seeding)
- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123  
- **User**: user@example.com / user123

### Quick Test Commands

1. **Register a new user**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User",
       "designation": "Developer",
       "role": "user"
     }'
   ```

2. **Login and get token**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Create a task (Manager/Admin only)**
   ```bash
   curl -X POST http://localhost:8000/api/tasks \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "title": "Complete API Documentation",
       "description": "Write comprehensive API documentation",
       "assignedTo": "USER_ID_HERE",
       "priority": "high",
       "dueDate": "2024-12-31T23:59:59.000Z",
       "tags": ["documentation", "api"]
     }'
   ```

4. **Get analytics overview**
   ```bash
   curl -X GET http://localhost:8000/api/analytics/overview \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

5. **Get daily metrics (Admin only)**
   ```bash
   curl -X GET http://localhost:8000/api/metrics/daily \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN"
   ```

### Test Coverage Report

**Coverage Metrics:**
- **Controllers**: >95% line coverage
- **Models**: >90% line coverage  
- **Routes**: 100% endpoint coverage
- **Middleware**: >95% function coverage
- **Validation**: 100% schema coverage

**Generate Coverage Report:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 📊 Database Schemas

### User Schema (MongoDB)
```javascript
{
  "username": "String (unique)",
  "email": "String (unique)",
  "password": "String (hashed)",
  "fullName": "String",
  "designation": "String",
  "role": "user | manager | admin",
  "avatar": "String (URL)",
  "isActive": "Boolean",
  "createdAt": "Date",
  "lastLogin": "Date"
}
```

### Task Schema
```javascript
{
  "title": "String (required)",
  "description": "String",
  "assignedTo": "ObjectId (User)",
  "createdBy": "ObjectId (User)",
  "priority": "low | medium | high",
  "status": "pending | in_progress | completed",
  "dueDate": "Date",
  "tags": ["String"],
  "completedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Comment Schema
```javascript
{
  "taskId": "ObjectId (Task)",
  "userId": "ObjectId (User)",
  "content": "String (required)",
  "isEdited": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Analytics Collections

#### task_activity
```javascript
{
  "taskId": "String",
  "userId": "String",
  "action": "created | updated | completed | commented",
  "ipAddress": "String",
  "userAgent": "String",
  "createdAt": "Date"
}
```

#### daily_task_metrics
```javascript
{
  "date": "Date",
  "totalTasksCreated": "Number",
  "totalTasksCompleted": "Number",
  "activeUsers": "Number"
}
```

## ⚙ Cron Jobs

### Cron Job 1: Daily Productivity Aggregation
- **Schedule**: Daily at midnight (Testing: Every 2 minutes)
- **Aggregates**: Tasks created, Tasks completed, Active users
- **Stores data in**: daily_task_metrics
- **Log**: "Aggregated metrics for {date}"

### Cron Job 2: Inactive User Detection
- **Schedule**: Every hour (Testing: Every 1 minute)
- **Function**: Mark users inactive if no activity in the last 30 days
- **Log**: "Marked {count} users inactive"

### Bonus Cron Job: Overdue Task Reminder
- **Schedule**: Every 5 minutes (Testing)
- **Function**: Identify overdue tasks
- **Log**: Reminder message per task

## 🔒 Security & Validation Requirements

- **Password hashing** using bcrypt (minimum 10 salt rounds)
- **JWT token** with 24-hour expiry
- **Middleware-based protected routes**
- **Email format validation**
- **Request body validation & sanitization**
- **Role-based access control**

## 📈 Functional Rules

### Task Management Rules
- Only task creator or admin can update a task
- Only admin can delete tasks
- Pagination using page and limit
- Filtering by status, priority, assignedTo
- Sorting by dueDate, priority, createdAt

### Comment Rules
- Only comment owner can update comments
- Owner or admin can delete comments