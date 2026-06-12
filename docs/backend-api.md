# Backend API Documentation

## Overview

This backend provides secure API endpoints for user authentication, model configuration management, drawing history storage, and AI model proxy services.

## Base URL

```
Development: http://localhost:3000/api
Production: TBD
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## API Endpoints

### 1. Authentication

#### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "createdAt": "timestamp"
    },
    "token": "jwt_token"
  }
}
```

**Errors:**
- 400: Invalid input
- 409: Username already exists

---

#### POST /auth/login

Login with existing credentials.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "createdAt": "timestamp"
    },
    "token": "jwt_token"
  }
}
```

**Errors:**
- 400: Invalid input
- 401: Invalid credentials

---

#### GET /auth/me

Get current user information (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "createdAt": "timestamp"
    }
  }
}
```

**Errors:**
- 401: Unauthorized

---

### 2. Model Configuration

#### GET /models

Get all model configurations for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "uuid",
        "name": "string",
        "provider": "openai|deepseek|qwen|moonshot|zhipu|other",
        "endpoint": "string",
        "model": "string",
        "enabled": "boolean",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
}
```

---

#### POST /models

Create a new model configuration.

**Request Body:**
```json
{
  "name": "string (max 50 chars)",
  "provider": "openai|deepseek|qwen|moonshot|zhipu|other",
  "endpoint": "string (valid URL)",
  "model": "string (max 100 chars)",
  "apiKey": "string (encrypted on server)",
  "enabled": "boolean"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "name": "string",
      "provider": "string",
      "endpoint": "string",
      "model": "string",
      "enabled": "boolean",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

**Errors:**
- 400: Invalid input
- 401: Unauthorized

---

#### PUT /models/:id

Update an existing model configuration.

**Request Body:** (same as POST /models, all fields optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profile": { /* updated profile */ }
  }
}
```

**Errors:**
- 400: Invalid input
- 401: Unauthorized
- 404: Profile not found

---

#### DELETE /models/:id

Delete a model configuration.

**Response (200):**
```json
{
  "success": true,
  "message": "Model configuration deleted"
}
```

**Errors:**
- 401: Unauthorized
- 404: Profile not found

---

### 3. AI Model Proxy

#### POST /ai/chat

Proxy request to AI model (uses user's active model configuration).

**Request Body:**
```json
{
  "profileId": "uuid (optional, uses default if not provided)",
  "messages": [
    {
      "role": "system|user|assistant",
      "content": "string"
    }
  ],
  "temperature": "number (optional, default 0.1)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "string (AI response)",
    "usage": {
      "promptTokens": "number",
      "completionTokens": "number",
      "totalTokens": "number"
    }
  }
}
```

**Errors:**
- 400: Invalid input or no active model configuration
- 401: Unauthorized
- 500: AI model service error

---

### 4. Drawing History

#### GET /drawings

Get all drawings for the authenticated user.

**Query Parameters:**
- `limit` (optional, default 50, max 100)
- `offset` (optional, default 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "drawings": [
      {
        "id": "uuid",
        "name": "string",
        "actions": "json (drawing actions array)",
        "thumbnail": "string (base64 or URL, optional)",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ],
    "total": "number"
  }
}
```

---

#### POST /drawings

Save a new drawing.

**Request Body:**
```json
{
  "name": "string (max 100 chars)",
  "actions": "array (drawing actions)",
  "thumbnail": "string (base64 image, optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "drawing": {
      "id": "uuid",
      "name": "string",
      "actions": "json",
      "thumbnail": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

**Errors:**
- 400: Invalid input
- 401: Unauthorized

---

#### GET /drawings/:id

Get a specific drawing.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "drawing": { /* drawing object */ }
  }
}
```

**Errors:**
- 401: Unauthorized
- 404: Drawing not found

---

#### PUT /drawings/:id

Update an existing drawing.

**Request Body:** (same as POST /drawings, all fields optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "drawing": { /* updated drawing */ }
  }
}
```

---

#### DELETE /drawings/:id

Delete a drawing.

**Response (200):**
```json
{
  "success": true,
  "message": "Drawing deleted"
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {} // optional additional details
  }
}
```

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Adjustable via environment variables

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- API key encryption at rest
- CORS protection
- Helmet security headers
- Rate limiting
- Input validation with Joi
