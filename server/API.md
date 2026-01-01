# SUSTRAIA API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
`POST /auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "ATLETA" // or "COACH"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ATLETA",
    "createdAt": "2025-12-27T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
`POST /auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ATLETA"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Get Profile
`GET /auth/profile` 🔒

Get current user profile.

**Response:** `200 OK`
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ATLETA",
    "createdAt": "2025-12-27T...",
    "coachId": "clxxx..." // if athlete
  }
}
```

---

## Workout Endpoints

### Get Workouts
`GET /workouts` 🔒

Get workouts (filtered by role - coaches see created, athletes see assigned).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "workouts": [
    {
      "id": "clxxx...",
      "date": "2025-12-30T...",
      "type": "RUN",
      "title": "Morning Run",
      "description": "5k easy run",
      "distance": 5000,
      "duration": 1800,
      "intensity": "easy",
      "notes": "Focus on form",
      "creator": {
        "id": "clxxx...",
        "name": "Coach Name"
      },
      "athlete": {
        "id": "clxxx...",
        "name": "Athlete Name",
        "email": "athlete@example.com"
      },
      "completedVersion": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Create Workout
`POST /workouts` 🔒 (COACH only)

Create new workout.

**Request Body:**
```json
{
  "date": "2025-12-30",
  "type": "RUN", // RUN, RIDE, SWIM, STRENGTH, YOGA, OTHER
  "title": "Morning Run",
  "description": "5k easy run (optional)",
  "distance": 5000, // in meters (optional)
  "duration": 1800, // in seconds (optional)
  "intensity": "easy", // easy, moderate, hard, race (optional)
  "assignedTo": "athlete-id (optional)",
  "notes": "Focus on form (optional)"
}
```

**Response:** `201 Created`

### Get Single Workout
`GET /workouts/:id` 🔒

Get workout details.

**Response:** `200 OK`

### Update Workout
`PUT /workouts/:id` 🔒 (creator only)

Update workout.

**Request Body:** Same as create (partial updates allowed)

**Response:** `200 OK`

### Delete Workout
`DELETE /workouts/:id` 🔒 (creator only)

Delete workout.

**Response:** `200 OK`
```json
{
  "success": true
}
```

### Complete Workout
`POST /workouts/:id/complete` 🔒 (ATLETA only)

Mark workout as completed.

**Request Body:**
```json
{
  "actualDuration": 1950, // in seconds (optional)
  "actualDistance": 5200, // in meters (optional)
  "avgHeartRate": 145, // bpm (optional)
  "maxHeartRate": 172, // bpm (optional)
  "calories": 450, // (optional)
  "feeling": "4/5", // (optional)
  "notes": "Felt good!" // (optional)
}
```

**Response:** `201 Created`

---

## Messaging Endpoints

### Send Message
`POST /messages` 🔒

Send message to coach/athlete.

**Request Body:**
```json
{
  "toId": "recipient-user-id",
  "content": "Great workout today!"
}
```

**Response:** `201 Created`

### Get Conversations
`GET /messages/conversations` 🔒

Get list of conversations.

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "partner": {
        "id": "clxxx...",
        "name": "Coach Name",
        "email": "coach@example.com",
        "role": "COACH"
      },
      "lastMessage": {
        "id": "clxxx...",
        "content": "See you tomorrow!",
        "createdAt": "2025-12-27T...",
        "read": false
      },
      "unreadCount": 2
    }
  ]
}
```

### Get Messages with User
`GET /messages/with/:userId` 🔒

Get all messages with specific user.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:** `200 OK`

### Mark Message as Read
`PATCH /messages/:id/read` 🔒

Mark message as read.

**Response:** `200 OK`

### Get Unread Count
`GET /messages/unread/count` 🔒

Get count of unread messages for authenticated user.

**Response:** `200 OK`
```json
{
  "count": 5
}
```

### Get Recent Messages
`GET /messages/recent` 🔒

Get recent messages for authenticated user (for dashboard widgets).

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 5, max: 20)

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "clxxx...",
      "fromId": "clxxx...",
      "toId": "clxxx...",
      "content": "Hola, ¿cómo vas con el entreno de hoy?",
      "read": false,
      "createdAt": "2025-12-27T10:30:00Z",
      "from": {
        "id": "clxxx...",
        "name": "Coach John",
        "role": "COACH"
      },
      "to": {
        "id": "clxxx...",
        "name": "Athlete Jane",
        "role": "ATLETA"
      }
    }
  ]
}
```

Get unread message count.

**Response:** `200 OK`
```json
{
  "count": 3
}
```

---

## Strava Endpoints

### Get Auth URL
`GET /strava/auth-url` 🔒

Get Strava OAuth authorization URL.

**Response:** `200 OK`
```json
{
  "authUrl": "https://www.strava.com/oauth/authorize?..."
}
```

### Handle OAuth Callback
`GET /strava/callback?code=xxx` 🔒

Handle Strava OAuth callback (exchange code for tokens).

**Response:** `200 OK`
```json
{
  "success": true,
  "athlete": {
    "id": 12345,
    "username": "athlete_username",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

### Get Connection Status
`GET /strava/status` 🔒

Check if user has connected Strava.

**Response:** `200 OK`
```json
{
  "connected": true,
  "athleteId": "12345",
  "connectedAt": "2025-12-27T..."
}
```

### Get Activities
`GET /strava/activities` 🔒

Get user's Strava activities.

**Query Parameters:**
- `page` (optional): Page number
- `perPage` (optional): Items per page (max: 100)

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "id": 123456,
      "name": "Morning Run",
      "type": "Run",
      "distance": 5242.5,
      "moving_time": 1863,
      "elapsed_time": 1920,
      "start_date": "2025-12-27T06:00:00Z",
      "average_heartrate": 148,
      "max_heartrate": 172,
      "calories": 435
    }
  ]
}
```

### Sync Activity
`POST /strava/sync` 🔒

Sync Strava activity to completed workout.

**Request Body:**
```json
{
  "activityId": "123456",
  "workoutId": "workout-id (optional)"
}
```

**Response:** `200 OK`

### Disconnect Strava
`DELETE /strava/disconnect` 🔒

Disconnect Strava account.

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

## Stats Endpoints

### Get Stats
`GET /stats` 🔒

Get calculated stats for current user.

**Response:** `200 OK`
```json
{
  "stats": {
    "totalWorkouts": 45,
    "totalDistance": 225000,
    "totalDuration": 81000,
    "weeklyWorkouts": 5,
    "weeklyDistance": 25000,
    "weeklyDuration": 9000,
    "monthlyWorkouts": 18,
    "monthlyDistance": 90000,
    "monthlyDuration": 32400
  }
}
```

### Get Stats History
`GET /stats/history/:metricName` 🔒

Get time-series data for specific metric.

**Query Parameters:**
- `days` (optional): Number of days (default: 30, max: 365)

**Response:** `200 OK`
```json
{
  "stats": [
    {
      "id": "clxxx...",
      "metricName": "totalWorkouts",
      "value": 42,
      "date": "2025-12-26T...",
      "createdAt": "2025-12-26T..."
    }
  ]
}
```

### Get Athlete Dashboard
`GET /stats/dashboard` 🔒 (ATLETA only)

Get comprehensive dashboard data for athlete.

**Response:** `200 OK`
```json
{
  "stats": { /* stats object */ },
  "upcomingWorkouts": [ /* array of workouts */ ],
  "recentCompleted": [ /* array of completed workouts */ ],
  "unreadMessages": 3
}
```

### Get Coach Dashboard
`GET /stats/coach-dashboard` 🔒 (COACH only)

Get comprehensive dashboard data for coach.

**Response:** `200 OK`
```json
{
  "athletes": [
    {
      "id": "clxxx...",
      "name": "Athlete Name",
      "email": "athlete@example.com",
      "createdAt": "2025-12-01T...",
      "stats": { /* athlete stats */ }
    }
  ],
  "recentWorkouts": [ /* workouts created by coach */ ],
  "unreadMessages": 5
}
```

### Get Coach Alerts
`GET /stats/coach-alerts` 🔒 (COACH only)

Get alerts for coach (low compliance athletes, no activity, etc).

**Response:** `200 OK`
```json
{
  "alerts": [
    {
      "id": "athlete123-low-compliance",
      "type": "low_compliance",
      "athleteId": "clxxx...",
      "athleteName": "John Doe",
      "message": "John Doe solo completó 1 de 4 entrenos esta semana",
      "detail": "Compliance: 25%",
      "createdAt": "2026-01-01T12:00:00Z"
    },
    {
      "id": "athlete456-no-activity",
      "type": "no_activity",
      "athleteId": "clyyy...",
      "athleteName": "Jane Smith",
      "message": "Jane Smith no ha registrado actividad en 7 días",
      "detail": "Considera contactar al atleta",
      "createdAt": "2026-01-01T12:00:00Z"
    }
  ]
}
```

**Alert Types:**
- `low_compliance`: Athlete completed < 50% of weekly workouts
- `no_activity`: No workouts registered in last 7 days
- `missed_workout`: Specific scheduled workout was missed

---

## User Endpoints

### Get My Coach
`GET /user/my-coach` 🔒 (ATLETA only)

Get coach information for authenticated athlete.

**Response:** `200 OK`
```json
{
  "coach": {
    "id": "clxxx...",
    "name": "Coach Name",
    "email": "coach@example.com"
  }
}
```

**Response (no coach assigned):** `200 OK`
```json
{
  "coach": null
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Error message",
  "errors": [ /* validation errors array (optional) */ ]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided" // or "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Webhook Endpoints

### Strava Webhook Verification
`GET /strava/webhook`

Strava uses this to verify webhook subscription.

### Strava Webhook Events
`POST /strava/webhook`

Receives activity events from Strava (automatic sync).

---

## Rate Limiting

Currently no rate limiting implemented. Will be added in production.

## CORS

CORS is enabled for the frontend URL specified in environment variables.

## WebSocket Support

Not currently implemented. Future feature for real-time messaging.
