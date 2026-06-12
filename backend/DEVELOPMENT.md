# Development notes and troubleshooting

## Common Issues

### 1. Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Verify DB_HOST and DB_PORT in .env
- Check PostgreSQL is listening: `netstat -an | grep 5432`

### 2. JWT Secret Warning

```
Warning: Using default JWT secret
```

**Solution:**
Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to .env as `JWT_SECRET`

### 3. CORS Error in Frontend

```
Access to fetch at 'http://localhost:3000/api/...' has been blocked by CORS policy
```

**Solution:**
- Verify CORS_ORIGIN in .env matches your frontend URL
- For development, set: `CORS_ORIGIN=http://localhost:8000`

### 4. Rate Limit Exceeded

```
Too many requests, please try again later
```

**Solution:**
- Default is 100 requests per 15 minutes
- Increase in .env: `RATE_LIMIT_MAX_REQUESTS=500`
- Or disable temporarily for development (not recommended)

## Development Workflow

### Hot Reload

Using Node.js built-in watch mode (Node 18+):
```bash
npm run dev
```

Or install nodemon:
```bash
npm install -D nodemon
# Update package.json: "dev": "nodemon src/index.js"
```

### Database Migrations

When you need to modify the schema:

1. Create migration file:
```sql
-- db/migrations/001_add_description_to_drawings.sql
ALTER TABLE drawings ADD COLUMN description TEXT;
```

2. Apply migration:
```bash
psql -U postgres -d voice_drawing -f db/migrations/001_add_description_to_drawings.sql
```

### Testing with curl

See `scripts/test-api.sh` for examples, or use individual commands:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Get user info (replace TOKEN)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend Integration Notes

### 1. Replace localStorage Account System

Old frontend code:
```javascript
// localStorage-based authentication
const users = JSON.parse(localStorage.getItem('voiceDrawing.users') || '{}');
```

New backend integration:
```javascript
// Call backend API
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { data } = await response.json();
localStorage.setItem('token', data.token);
```

### 2. AI Model Proxy

Old frontend code:
```javascript
// Direct API call with user's API key
const response = await fetch(config.endpoint, {
  headers: { 'Authorization': `Bearer ${config.apiKey}` },
  body: JSON.stringify({ model: config.model, messages })
});
```

New backend proxy:
```javascript
// Call backend proxy (API key stays on server)
const response = await fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ messages, profileId })
});
```

### 3. Save Drawing History

```javascript
// Save current drawing to cloud
const response = await fetch('http://localhost:3000/api/drawings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    name: 'My Drawing',
    actions: drawingHistory,
    thumbnail: canvas.toDataURL('image/png')
  })
});
```

## Performance Considerations

### Database Indexing

Current indexes:
- `users.username` - for fast login lookups
- `model_profiles.user_id` - for profile queries
- `drawings.user_id` - for user's drawing list
- `drawings.created_at` - for sorting by date

### Caching Strategy (Future)

For production, consider:
- Redis for session caching
- Cache model profiles in memory (refresh on update)
- CDN for static assets

### Connection Pooling

Current pool settings (in `src/config/database.js`):
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 2s

Adjust based on load:
```javascript
max: 50,  // Increase for high traffic
idleTimeoutMillis: 60000,
```

## Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure production database
- [ ] Enable HTTPS/TLS
- [ ] Update CORS_ORIGIN
- [ ] Set NODE_ENV=production
- [ ] Configure logging (Winston, Pino)
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Enable database backups
- [ ] Review rate limits
- [ ] Set up CI/CD pipeline
- [ ] Configure environment-specific .env files

## API Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "testuser",
      "createdAt": "2026-06-12T10:30:00.000Z"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Username already exists",
    "code": "CONFLICT"
  }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "username",
        "message": "Username must be at least 3 characters long"
      }
    ]
  }
}
```
