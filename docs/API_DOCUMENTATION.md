# SkillSwap API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 2025  
> **Base URL:** `http://localhost:3000` (development) / `https://api.skillswap.com` (production)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Skills](#skills)
4. [Matches](#matches)
5. [Requests](#requests)
6. [Messages](#messages)
7. [Gamification](#gamification)
8. [WebSocket Events](#websocket-events)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

### POST /auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "bio": null,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### POST /auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "bio": null
  }
}
```

---

## 👤 Users

### GET /users/me
Get current user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "bio": "Full-stack developer",
  "xp": 1250,
  "level": 3,
  "is_verified": true,
  "created_at": "2025-01-15T10:30:00Z",
  "skills": [
    {
      "id": "uuid",
      "name": "React",
      "category": "Frontend",
      "proficiency": "Expert"
    }
  ]
}
```

### PUT /users/me
Update user profile.

**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "Updated bio",
  "avatar": "https://..."
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Updated",
  "bio": "Updated bio",
  "avatar": "https://...",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

---

## 🎯 Skills

### GET /skills
Get all available skills.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "React",
    "category": "Frontend Development",
    "description": "A JavaScript library for building user interfaces"
  },
  {
    "id": "uuid",
    "name": "Node.js",
    "category": "Backend Development",
    "description": "JavaScript runtime built on Chrome's V8 engine"
  }
]
```

### POST /users/me/skills
Add skill to current user.

**Request Body:**
```json
{
  "skill_id": "uuid",
  "proficiency": "Intermediate",
  "is_offering": true
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "skill_id": "uuid",
  "proficiency": "Intermediate",
  "is_offering": true,
  "created_at": "2025-01-15T11:00:00Z"
}
```

### DELETE /users/me/skills/:id
Remove skill from current user.

**Response (200):**
```json
{
  "message": "Skill removed successfully"
}
```

---

## 💝 Matches

### GET /matches/recommended
Get recommended matches based on skills.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)
- `offset` (optional): Pagination offset

**Response (200):**
```json
{
  "matches": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Jane Smith",
        "avatar": "https://...",
        "bio": "UX Designer"
      },
      "score": 85,
      "mutual_skills": [
        {
          "name": "Figma",
          "category": "Design"
        }
      ],
      "complementary_skills": [
        {
          "name": "React",
          "category": "Frontend"
        }
      ],
      "match_reason": "You can teach React, they can teach Figma"
    }
  ],
  "total": 25
}
```

### GET /matches
Get user's accepted matches.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user1_id": "uuid",
    "user2_id": "uuid",
    "created_at": "2025-01-15T11:00:00Z",
    "otherUser": {
      "id": "uuid",
      "name": "Jane Smith",
      "avatar": "https://...",
      "is_online": true
    }
  }
]
```

---

## 📨 Requests

### POST /requests
Send a match request.

**Request Body:**
```json
{
  "receiver_id": "uuid",
  "message": "Hi! I'd love to learn Figma from you. I can help with React!"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "status": "pending",
  "message": "Hi! I'd love to learn Figma...",
  "created_at": "2025-01-15T11:00:00Z"
}
```

### GET /requests/incoming
Get incoming match requests.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "sender": {
      "id": "uuid",
      "name": "Jane Smith",
      "avatar": "https://..."
    },
    "message": "Hi! I'd love to learn...",
    "status": "pending",
    "created_at": "2025-01-15T11:00:00Z"
  }
]
```

### GET /requests/sent
Get sent match requests.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "receiver": {
      "id": "uuid",
      "name": "Jane Smith",
      "avatar": "https://..."
    },
    "status": "pending",
    "created_at": "2025-01-15T11:00:00Z"
  }
]
```

### PUT /requests/:id/accept
Accept a match request.

**Response (200):**
```json
{
  "message": "Request accepted",
  "match": {
    "id": "uuid",
    "user1_id": "uuid",
    "user2_id": "uuid",
    "created_at": "2025-01-15T11:00:00Z"
  }
}
```

### PUT /requests/:id/reject
Reject a match request.

**Response (200):**
```json
{
  "message": "Request rejected"
}
```

---

## 💬 Messages

### GET /matches/:id/messages
Get messages for a match.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "match_id": "uuid",
    "sender_id": "uuid",
    "content": "Hey! When are you free to chat?",
    "is_read": false,
    "created_at": "2025-01-15T11:00:00Z",
    "sender": {
      "id": "uuid",
      "name": "Jane Smith",
      "avatar": "https://..."
    }
  }
]
```

### POST /messages
Send a message.

**Request Body:**
```json
{
  "match_id": "uuid",
  "content": "Hey! When are you free to chat?"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "match_id": "uuid",
  "sender_id": "uuid",
  "content": "Hey! When are you free to chat?",
  "is_read": false,
  "created_at": "2025-01-15T11:00:00Z",
  "sender": {
    "id": "uuid",
    "name": "John Doe",
    "avatar": "https://..."
  }
}
```

### PUT /messages/:id/read
Mark message as read.

**Response (200):**
```json
{
  "message": "Message marked as read"
}
```

---

## 🎮 Gamification

### GET /gamification/stats
Get user's gamification stats.

**Response (200):**
```json
{
  "xp": 1250,
  "level": 3,
  "level_title": "Skilled",
  "next_level_xp": 2000,
  "progress_percentage": 62.5,
  "achievements": [
    {
      "id": "first_skill",
      "name": "First Skill",
      "description": "Add your first skill",
      "icon": "🎯",
      "unlocked_at": "2025-01-15T11:00:00Z"
    }
  ],
  "streak": {
    "current": 5,
    "longest": 12,
    "last_activity": "2025-01-15T11:00:00Z"
  },
  "stats": {
    "sessions_completed": 8,
    "rating": 4.8,
    "total_ratings": 12
  }
}
```

### POST /gamification/xp
Award XP to user (internal use).

**Request Body:**
```json
{
  "amount": 50,
  "reason": "completed_session",
  "description": "Completed a skill swap session"
}
```

### GET /gamification/leaderboard
Get top users by XP.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10)

**Response (200):**
```json
[
  {
    "rank": 1,
    "user": {
      "id": "uuid",
      "name": "Top User",
      "avatar": "https://..."
    },
    "xp": 5000,
    "level": 5,
    "achievements_count": 8
  }
]
```

---

## 🔌 WebSocket Events

Connect to WebSocket server at: `ws://localhost:3000` (Socket.io)

### Client → Server Events

#### join_match
Join a match room to receive messages.

```javascript
socket.emit("join_match", { match_id: "uuid" });
```

#### leave_match
Leave a match room.

```javascript
socket.emit("leave_match", { match_id: "uuid" });
```

#### send_message
Send a real-time message.

```javascript
socket.emit("send_message", {
  match_id: "uuid",
  content: "Hello!"
});
```

#### typing
Indicate typing status.

```javascript
socket.emit("typing", {
  match_id: "uuid",
  is_typing: true
});
```

### Server → Client Events

#### message_received
New message in match.

```javascript
socket.on("message_received", (data) => {
  console.log(data);
  // {
  //   id: "uuid",
  //   match_id: "uuid",
  //   sender_id: "uuid",
  //   content: "Hello!",
  //   created_at: "2025-01-15T11:00:00Z",
  //   sender: { ... }
  // }
});
```

#### user_typing
User typing indicator.

```javascript
socket.on("user_typing", (data) => {
  console.log(data);
  // {
  //   match_id: "uuid",
  //   user_id: "uuid",
  //   is_typing: true
  // }
});
```

#### user_online
User online status change.

```javascript
socket.on("user_online", (data) => {
  console.log(data);
  // {
  //   user_id: "uuid",
  //   is_online: true
  // }
});
```

#### error
Error event.

```javascript
socket.on("error", (data) => {
  console.error(data.message);
});
```

---

## ⚠️ Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (development only)",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created              |
| 400  | Bad Request - Invalid input             |
| 401  | Unauthorized - Invalid/missing token    |
| 403  | Forbidden - Not allowed                 |
| 404  | Not Found - Resource doesn't exist      |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

### Error Codes

| Code             | Description               |
| ---------------- | ------------------------- |
| `INVALID_INPUT`  | Request validation failed |
| `UNAUTHORIZED`   | Authentication required   |
| `FORBIDDEN`      | Insufficient permissions  |
| `NOT_FOUND`      | Resource not found        |
| `RATE_LIMITED`   | Too many requests         |
| `INTERNAL_ERROR` | Server error              |

---

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse.

### General Endpoints
- **Limit:** 100 requests per 15 minutes per IP
- **Applies to:** All endpoints except auth

### Authentication Endpoints
- **Limit:** 5 requests per 15 minutes per IP
- **Applies to:** `/auth/signup`, `/auth/login`
- **Note:** Successful requests don't count toward limit

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642341600
```

When rate limit is exceeded:

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## 📱 Mobile Considerations

- All endpoints support CORS for mobile apps
- Image uploads should be optimized before sending
- Use WebSocket for real-time features
- Implement offline caching for better UX

---

## 🔒 Security

- All endpoints use HTTPS in production
- JWT tokens expire after 24 hours
- Passwords hashed with bcrypt (12 rounds)
- Input sanitized to prevent XSS
- Helmet headers for additional protection

---

## 📝 Changelog

### v1.0.0 (January 2025)
- Initial API release
- Authentication system
- User management
- Skills system
- Matching algorithm
- Real-time chat (WebSocket)
- Gamification system
- Rate limiting
- Security hardening

---

**For support or questions, contact:** support@skillswap.com
