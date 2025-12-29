# Task Management & Productivity Analytics Platform - API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {}, // Response data (if applicable)
  "error": "Error message", // Only present on errors
  "details": [] // Validation errors (if applicable)
}
```

## Status Codes
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Part 1: User Authentication & Management APIs

### Register a new user
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "designation": "Software Developer",
  "role": "user"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "676c8f9e123456789abcdef0",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "designation": "Software Developer",
    "role": "user",
    "avatar": null,
    "isActive": true,
    "createdAt": "2024-12-25T10:00:00.000Z",
    "lastLogin": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login and return JWT token
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "676c8f9e123456789abcdef0",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "user",
    "lastLogin": "2024-12-25T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout and invalidate token
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Logout from all devices
```http
POST /api/auth/logout-all
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

### Forgot password - Send OTP
```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If the email exists in our system, an OTP has been sent to your email address."
}
```

### Verify OTP for forgot password
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15 minutes"
}
```

### Reset password with JWT token
```http
POST /api/auth/reset-password
Authorization: Bearer <reset-token>
```

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password."
}
```

**Note**: Resetting password will revoke all active sessions for security.

### Get logged-in user profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "_id": "676c8f9e123456789abcdef0",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "designation": "Software Developer",
    "role": "user",
    "avatar": null,
    "isActive": true,
    "createdAt": "2024-12-25T10:00:00.000Z",
    "lastLogin": "2024-12-25T10:30:00.000Z"
  }
}
```

### Update user profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "designation": "Senior Software Developer",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "676c8f9e123456789abcdef0",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John Updated Doe",
    "designation": "Senior Software Developer",
    "role": "user",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

## Part 2: Task Management APIs

### Create task (manager/admin only)
```http
POST /api/tasks
Authorization: Bearer <manager-or-admin-token>
```

**Request Body:**
```json
{
  "title": "Implement User Authentication",
  "description": "Create login and registration functionality with JWT tokens",
  "assignedTo": "676c8f9e123456789abcdef0",
  "priority": "high",
  "dueDate": "31/12/2025",
  "tags": ["authentication", "security", "backend"]
}
```

**Supported Date Formats:**
- `DD/MM/YYYY` (e.g., "31/12/2025")
- `YYYY-MM-DD` (e.g., "2025-12-31")
- `DD-MM-YYYY` (e.g., "31-12-2025")
- ISO format (e.g., "2025-12-31T23:59:59.000Z")

**Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "676c8f9e123456789abcdef1",
    "title": "Implement User Authentication",
    "description": "Create login and registration functionality with JWT tokens",
    "assignedTo": {
      "_id": "676c8f9e123456789abcdef0",
      "username": "johndoe",
      "fullName": "John Doe",
      "email": "john.doe@example.com"
    },
    "createdBy": {
      "_id": "676c8f9e123456789abcdef2",
      "username": "manager",
      "fullName": "Jane Manager"
    },
    "priority": "high",
    "status": "pending",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "tags": ["authentication", "security", "backend"],
    "completedAt": null,
    "createdAt": "2024-12-25T11:00:00.000Z",
    "updatedAt": "2024-12-25T11:00:00.000Z"
  }
}
```

### List tasks (manager/admin only)
```http
GET /api/tasks?page=1&limit=10&status=pending&priority=high&sort=-createdAt
Authorization: Bearer <manager-or-admin-token>
```

**Access:** Manager and Admin only

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (pending, in_progress, completed)
- `priority` - Filter by priority (low, medium, high)
- `assignedTo` - Filter by assigned user ID
- `startDate` - Filter tasks from date
- `endDate` - Filter tasks to date
- `search` - Search in title and description
- `sort` - Sort by: dueDate, -dueDate, priority, -priority, createdAt, -createdAt

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "676c8f9e123456789abcdef1",
        "title": "Implement User Authentication",
        "description": "Create login and registration functionality",
        "assignedTo": {
          "_id": "676c8f9e123456789abcdef0",
          "username": "johndoe",
          "fullName": "John Doe"
        },
        "createdBy": {
          "_id": "676c8f9e123456789abcdef2",
          "username": "manager",
          "fullName": "Jane Manager"
        },
        "priority": "high",
        "status": "pending",
        "dueDate": "2024-12-31T23:59:59.000Z",
        "tags": ["authentication", "security"],
        "createdAt": "2024-12-25T11:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTasks": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get task details (manager/admin only)
```http
GET /api/tasks/:id
Authorization: Bearer <manager-or-admin-token>
```

**Access:** Manager and Admin only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "676c8f9e123456789abcdef1",
    "title": "Implement User Authentication",
    "description": "Create login and registration functionality with JWT tokens",
    "assignedTo": {
      "_id": "676c8f9e123456789abcdef0",
      "username": "johndoe",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "designation": "Software Developer"
    },
    "createdBy": {
      "_id": "676c8f9e123456789abcdef2",
      "username": "manager",
      "fullName": "Jane Manager",
      "designation": "Project Manager"
    },
    "priority": "high",
    "status": "pending",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "tags": ["authentication", "security", "backend"],
    "completedAt": null,
    "createdAt": "2024-12-25T11:00:00.000Z",
    "updatedAt": "2024-12-25T11:00:00.000Z"
  }
}
```

### Update task (creator/admin)
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Implement User Authentication - Updated",
  "status": "in_progress",
  "priority": "medium"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "_id": "676c8f9e123456789abcdef1",
    "title": "Implement User Authentication - Updated",
    "status": "in_progress",
    "priority": "medium",
    "updatedAt": "2024-12-25T12:00:00.000Z"
  }
}
```

### Delete task (admin only)
```http
DELETE /api/tasks/:id
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Mark task completed
```http
PATCH /api/tasks/:id/complete
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task marked as completed",
  "data": {
    "_id": "676c8f9e123456789abcdef1",
    "status": "completed",
    "completedAt": "2024-12-25T15:30:00.000Z",
    "updatedAt": "2024-12-25T15:30:00.000Z"
  }
}
```

### Tasks assigned to current user
```http
GET /api/tasks/my-tasks?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

**Access:** All authenticated users (shows only tasks assigned to the requesting user)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "676c8f9e123456789abcdef1",
        "title": "Implement User Authentication",
        "priority": "high",
        "status": "pending",
        "dueDate": "2024-12-31T23:59:59.000Z",
        "createdBy": {
          "_id": "676c8f9e123456789abcdef2",
          "username": "manager",
          "fullName": "Jane Manager"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalTasks": 15,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": {
      "totalAssigned": 15,
      "completed": 8,
      "pending": 5,
      "inProgress": 2,
      "overdue": 1,
      "completionRate": "53.33"
    }
  }
}
```

### Task search API (manager/admin only)
```http
GET /api/tasks/search?q=keyword&page=1&limit=10
Authorization: Bearer <manager-or-admin-token>
```

**Access:** Manager and Admin only

**Query Parameters:**
- `q` - Search keyword (required, searches in title, description, and tags)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (pending, in_progress, completed)
- `priority` - Filter by priority (low, medium, high)
- `assignedTo` - Filter by assigned user ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "676c8f9e123456789abcdef1",
        "title": "Implement User Authentication",
        "description": "Create login and registration functionality",
        "assignedTo": {
          "_id": "676c8f9e123456789abcdef0",
          "username": "johndoe",
          "fullName": "John Doe"
        },
        "priority": "high",
        "status": "pending",
        "tags": ["authentication", "security"],
        "createdAt": "2024-12-25T11:00:00.000Z"
      }
    ],
    "searchQuery": "authentication",
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalTasks": 3,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

## Part 3: Comments & Activity Tracking APIs

### Add comment
```http
POST /api/tasks/:taskId/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "This task is progressing well. Need to add unit tests."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "676c8f9e123456789abcdef3",
    "taskId": "676c8f9e123456789abcdef1",
    "userId": {
      "_id": "676c8f9e123456789abcdef0",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatar": null
    },
    "content": "This task is progressing well. Need to add unit tests.",
    "isEdited": false,
    "likes": [],
    "replies": [],
    "createdAt": "2024-12-25T13:00:00.000Z",
    "updatedAt": "2024-12-25T13:00:00.000Z"
  }
}
```

### List comments
```http
GET /api/tasks/:taskId/comments?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "676c8f9e123456789abcdef3",
        "taskId": "676c8f9e123456789abcdef1",
        "userId": {
          "_id": "676c8f9e123456789abcdef0",
          "username": "johndoe",
          "fullName": "John Doe",
          "avatar": null
        },
        "content": "This task is progressing well. Need to add unit tests.",
        "isEdited": false,
        "likeCount": 2,
        "replyCount": 1,
        "likes": [
          {
            "user": "676c8f9e123456789abcdef2",
            "likedAt": "2024-12-25T13:15:00.000Z"
          }
        ],
        "replies": [
          {
            "user": {
              "_id": "676c8f9e123456789abcdef2",
              "username": "manager",
              "fullName": "Jane Manager"
            },
            "content": "Great work! Keep it up.",
            "createdAt": "2024-12-25T13:30:00.000Z"
          }
        ],
        "createdAt": "2024-12-25T13:00:00.000Z",
        "updatedAt": "2024-12-25T13:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalComments": 3,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Update comment (owner only)
```http
PUT /api/comments/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "This task is progressing well. Unit tests have been added."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "_id": "676c8f9e123456789abcdef3",
    "content": "This task is progressing well. Unit tests have been added.",
    "isEdited": true,
    "editedAt": "2024-12-25T14:00:00.000Z",
    "updatedAt": "2024-12-25T14:00:00.000Z"
  }
}
```

### Delete comment (owner/admin)
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Part 4: Productivity Analytics APIs

### Analytics overview
```http
GET /api/analytics/overview
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTasks": 150,
      "completedTasks": 95,
      "activeUsers": 25,
      "completionRate": 63.33
    },
    "taskBreakdown": {
      "pending": 30,
      "inProgress": 25,
      "completed": 95,
      "overdue": 8
    },
    "todayMetrics": {
      "tasksCreated": 5,
      "tasksCompleted": 8,
      "activeUsers": 12,
      "comments": 15
    },
    "userMetrics": {
      "total": 50,
      "active": 25,
      "inactive": 25
    },
    "engagement": {
      "totalComments": 245,
      "averageCommentsPerTask": "1.63"
    }
  }
}
```

### User productivity
```http
GET /api/analytics/user/:userId?timeframe=month
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeframe` - week, month, quarter, year (default: month)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "676c8f9e123456789abcdef0",
      "username": "johndoe",
      "fullName": "John Doe",
      "designation": "Software Developer"
    },
    "timeframe": "month",
    "productivity": {
      "tasksAssigned": 25,
      "tasksCompleted": 18,
      "tasksCreated": 5,
      "completionRate": 72.00,
      "averageCompletionDays": 3.2,
      "commentsCount": 45
    },
    "breakdown": {
      "byPriority": [
        { "_id": "high", "count": 8 },
        { "_id": "medium", "count": 12 },
        { "_id": "low", "count": 5 }
      ],
      "byStatus": [
        { "_id": "completed", "count": 18 },
        { "_id": "in_progress", "count": 4 },
        { "_id": "pending", "count": 3 }
      ]
    },
    "activityLevel": 125
  }
}
```

### Task trends
```http
GET /api/analytics/tasks/trending?days=7
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` - Number of days to analyze (default: 7, max: 365)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "timeframe": "Last 7 days",
    "dailyTrends": [
      {
        "_id": { "date": "2024-12-25" },
        "tasksCreated": 8,
        "tasksCompleted": 12
      },
      {
        "_id": { "date": "2024-12-24" },
        "tasksCreated": 5,
        "tasksCompleted": 7
      }
    ],
    "mostActiveTasks": [
      {
        "taskId": "676c8f9e123456789abcdef1",
        "title": "Implement User Authentication",
        "status": "completed",
        "priority": "high",
        "commentCount": 15
      },
      {
        "taskId": "676c8f9e123456789abcdef4",
        "title": "Setup Database Schema",
        "status": "in_progress",
        "priority": "medium",
        "commentCount": 12
      }
    ],
    "priorityTrends": [
      {
        "_id": { "date": "2024-12-25", "priority": "high" },
        "count": 3
      },
      {
        "_id": { "date": "2024-12-25", "priority": "medium" },
        "count": 4
      }
    ]
  }
}
```

---

## Analytics Collections

### task_activity Collection
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

### daily_task_metrics Collection
```javascript
{
  "date": "Date",
  "totalTasksCreated": "Number",
  "totalTasksCompleted": "Number", 
  "activeUsers": "Number"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Please check your input data",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Access denied",
  "message": "No token provided"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "error": "Access denied",
  "message": "Manager or Admin role required"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "Task not found",
  "message": "Task with this ID does not exist"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong on our end"
}
```

---

## Security & Validation Requirements

### Password Requirements
- Minimum 6 characters
- Hashed using bcrypt with minimum 10 salt rounds

### JWT Token
- 24-hour expiry
- Secure token generation
- Required for all protected routes

### Role-based Access Control
- **user**: Can view and complete assigned tasks, add comments
- **manager**: Can create tasks, view all tasks, manage team workload
- **admin**: Full access to all operations including user management

### Request Validation
- Email format validation
- Request body validation & sanitization using Joi
- Input length limits and type checking
- XSS protection through input sanitization

---

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP address
- **Response when exceeded**:
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Functional Rules

### Task Management Rules
1. Only task creator or admin can update a task
2. Only admin can delete tasks  
3. Pagination using page and limit parameters
4. Filtering by status, priority, assignedTo
5. Sorting by dueDate, priority, createdAt

### Comment Rules
1. Only comment owner can update comments
2. Owner or admin can delete comments
3. All users can like/unlike comments
4. All users can reply to comments

### Analytics Rules
1. Users can only view their own analytics unless they're manager/admin
2. Workload distribution is manager/admin only
3. Overview and trending data available to all authenticated users

---

---

## Part 5: Metrics APIs (Admin Only)

### Get daily task metrics
```http
GET /api/metrics/daily?page=1&limit=30&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 30, max: 100)
- `startDate` - Filter from date (YYYY-MM-DD format)
- `endDate` - Filter to date (YYYY-MM-DD format)

**Response (200):**
```json
{
  "message": "Daily metrics retrieved successfully",
  "metrics": [
    {
      "_id": "676c8f9e123456789abcdef1",
      "date": "2024-12-25T00:00:00.000Z",
      "tasksCreated": 15,
      "tasksCompleted": 12,
      "activeUsers": 8,
      "totalTasks": 150,
      "pendingTasks": 45,
      "inProgressTasks": 23,
      "overdueTasks": 5,
      "completionRate": 80.0,
      "averageCompletionTime": 2.5,
      "tasksByPriority": {
        "low": 30,
        "medium": 60,
        "high": 45,
        "urgent": 15
      },
      "tasksByStatus": {
        "pending": 45,
        "in_progress": 23,
        "completed": 82,
        "cancelled": 0
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 150,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get metrics for specific date
```http
GET /api/metrics/daily/2024-12-25
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Response (200):**
```json
{
  "message": "Metrics retrieved successfully",
  "metrics": {
    "_id": "676c8f9e123456789abcdef1",
    "date": "2024-12-25T00:00:00.000Z",
    "tasksCreated": 15,
    "tasksCompleted": 12,
    "activeUsers": 8,
    "completionRate": 80.0,
    "averageCompletionTime": 2.5,
    "tasksByPriority": {
      "low": 30,
      "medium": 60,
      "high": 45,
      "urgent": 15
    },
    "tasksByStatus": {
      "pending": 45,
      "in_progress": 23,
      "completed": 82,
      "cancelled": 0
    }
  }
}
```

### Get metrics summary for date range
```http
GET /api/metrics/summary?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD format)
- `endDate` - End date (YYYY-MM-DD format)
- `days` - Number of days from today (alternative to date range)
- `page` - Page number for daily metrics (default: 1)
- `limit` - Items per page for daily metrics (default: 100)

**Response (200):**
```json
{
  "message": "Metrics summary retrieved successfully",
  "summary": {
    "totalDays": 31,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "averageTasksCreated": 12.5,
    "averageTasksCompleted": 9.8,
    "averageActiveUsers": 15.2,
    "averageCompletionRate": 78.4,
    "totalTasksCreated": 387,
    "totalTasksCompleted": 304,
    "overallCompletionRate": 78.55
  },
  "dailyMetrics": [
    {
      "date": "2024-01-31T00:00:00.000Z",
      "tasksCreated": 10,
      "tasksCompleted": 8,
      "activeUsers": 12,
      "completionRate": 80.0
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalRecords": 31,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Trigger manual metrics aggregation
```http
POST /api/metrics/aggregate
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Response (200):**
```json
{
  "message": "Metrics aggregation completed successfully"
}
```

---

## Part 6: User Management APIs (Admin Only)

### Get all users
```http
GET /api/users?page=1&limit=10&role=user&isActive=true
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `role` - Filter by role (user, manager, admin)
- `isActive` - Filter by active status (true, false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "676c8f9e123456789abcdef0",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "designation": "Software Developer",
        "role": "user",
        "avatar": null,
        "isActive": true,
        "createdAt": "2024-12-25T10:00:00.000Z",
        "lastLogin": "2024-12-25T15:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get user by ID
```http
GET /api/users/676c8f9e123456789abcdef0
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "676c8f9e123456789abcdef0",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "designation": "Software Developer",
      "role": "user",
      "avatar": null,
      "isActive": true,
      "createdAt": "2024-12-25T10:00:00.000Z",
      "lastLogin": "2024-12-25T15:30:00.000Z"
    }
  }
}
```

### Update user profile
```http
PUT /api/users/676c8f9e123456789abcdef0
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "designation": "Senior Software Developer",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "676c8f9e123456789abcdef0",
      "fullName": "John Updated Doe",
      "designation": "Senior Software Developer",
      "avatar": "https://example.com/avatar.jpg",
      "updatedAt": "2024-12-25T16:00:00.000Z"
    }
  }
}
```

### Update user role
```http
PUT /api/users/676c8f9e123456789abcdef0/role
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Request Body:**
```json
{
  "role": "manager"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "_id": "676c8f9e123456789abcdef0",
      "role": "manager",
      "updatedAt": "2024-12-25T16:00:00.000Z"
    }
  }
}
```

### Deactivate user
```http
DELETE /api/users/676c8f9e123456789abcdef0
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### Activate user
```http
PUT /api/users/676c8f9e123456789abcdef0/activate
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

### Get user statistics overview
```http
GET /api/users/stats/overview
Authorization: Bearer <admin-token>
```

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 150,
      "activeUsers": 142,
      "inactiveUsers": 8,
      "usersByRole": {
        "user": 120,
        "manager": 25,
        "admin": 5
      },
      "recentRegistrations": {
        "today": 5,
        "thisWeek": 23,
        "thisMonth": 87
      }
    }
  }
```
