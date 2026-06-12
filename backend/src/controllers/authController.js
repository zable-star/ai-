import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import config from '../config/index.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

const SALT_ROUNDS = 10;

export const register = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictError('Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const result = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
    [username, passwordHash]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.status(201).json(successResponse({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.created_at,
    },
    token,
  }));
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const result = await pool.query(
    'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json(successResponse({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.created_at,
    },
    token,
  }));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  res.json(successResponse({
    user: result.rows[0],
  }));
});
