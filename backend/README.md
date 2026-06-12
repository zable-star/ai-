# Backend

Backend API service for the AI voice drawing tool.

## Features

- 🔐 JWT-based authentication
- 👤 User registration and login
- 🤖 AI model configuration management (DeepSeek, OpenAI, Qwen, etc.)
- 🔒 Encrypted API key storage
- 🎨 Drawing history cloud storage
- 🛡️ Secure API proxy for AI models
- ⚡ Rate limiting and security headers

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Install PostgreSQL and create a database:

```bash
# Using psql
createdb voice_drawing

# Or with psql command
psql -U postgres
CREATE DATABASE voice_drawing;
```

Run the schema:

```bash
psql -U postgres -d voice_drawing -f db/schema.sql
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voice_drawing
DB_USER=postgres
DB_PASSWORD=your_password

# JWT (IMPORTANT: Change in production!)
JWT_SECRET=your_random_secret_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8000
```

**Security Note**: Generate a strong JWT secret for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:3000`.

## API Documentation

See [docs/backend-api.md](../docs/backend-api.md) for complete API documentation.

### Quick Reference

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

**Model Configuration:**
- `GET /api/models` - Get all model profiles
- `POST /api/models` - Create new profile
- `PUT /api/models/:id` - Update profile
- `DELETE /api/models/:id` - Delete profile

**AI Proxy:**
- `POST /api/ai/chat` - Proxy AI model requests

**Drawings:**
- `GET /api/drawings` - Get all drawings (paginated)
- `POST /api/drawings` - Save new drawing
- `GET /api/drawings/:id` - Get specific drawing
- `PUT /api/drawings/:id` - Update drawing
- `DELETE /api/drawings/:id` - Delete drawing

## Project Structure

```
backend/
├── db/
│   └── schema.sql           # Database schema
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection
│   │   └── index.js         # Configuration loader
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── modelController.js
│   │   ├── drawingController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── validation.js    # Joi schemas
│   │   └── errorHandler.js  # Error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── modelRoutes.js
│   │   ├── drawingRoutes.js
│   │   └── aiRoutes.js
│   ├── utils/
│   │   ├── errors.js        # Custom error classes
│   │   ├── encryption.js    # API key encryption
│   │   └── helpers.js       # Utility functions
│   └── index.js             # Express app entry point
├── .env.example
├── .gitignore
└── package.json
```

## Security Features

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored in plain text

### API Key Protection
- Model API keys encrypted with AES-256-GCM
- Encryption key derived from JWT secret
- Keys never returned in API responses (except when proxying)

### Authentication
- JWT tokens with configurable expiration
- Tokens required for all protected endpoints
- User ID embedded in token payload

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

### Additional Security
- Helmet.js for security headers
- CORS protection
- Input validation with Joi
- SQL injection prevention (parameterized queries)

## Development

### Testing the API

Using curl:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Use the token
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Database Migrations

For schema changes, create new SQL files and apply them:

```bash
psql -U postgres -d voice_drawing -f db/migrations/001_add_column.sql
```

## Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Update `CORS_ORIGIN` to frontend URL
- [ ] Enable HTTPS/TLS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Review rate limits

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

Build and run:

```bash
docker build -t voice-drawing-backend .
docker run -p 3000:3000 --env-file .env voice-drawing-backend
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d voice_drawing -c "SELECT 1"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Or on Windows
netstat -ano | findstr :3000

# Kill the process or change PORT in .env
```

## Future Extensions

- [ ] Redis caching for sessions
- [ ] WebSocket support for real-time collaboration
- [ ] File storage service (S3/MinIO) for drawings
- [ ] Usage analytics and metrics
- [ ] Email verification
- [ ] Password reset functionality
- [ ] OAuth integration
- [ ] API versioning
