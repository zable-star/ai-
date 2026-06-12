import pool from '../config/database.js';
import config from '../config/index.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

const ENCRYPTION_SECRET = config.jwt.secret; // Use JWT secret for encryption

export const getProfiles = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, provider, endpoint, model, enabled, created_at, updated_at
     FROM model_profiles
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  res.json(successResponse({
    profiles: result.rows,
  }));
});

export const createProfile = asyncHandler(async (req, res) => {
  const { name, provider, endpoint, model, apiKey, enabled } = req.body;

  // Encrypt API key
  const apiKeyEncrypted = encrypt(apiKey, ENCRYPTION_SECRET);

  const result = await pool.query(
    `INSERT INTO model_profiles (user_id, name, provider, endpoint, model, api_key_encrypted, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, provider, endpoint, model, enabled, created_at, updated_at`,
    [req.user.id, name, provider, endpoint, model, apiKeyEncrypted, enabled]
  );

  res.status(201).json(successResponse({
    profile: result.rows[0],
  }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if profile exists and belongs to user
  const existingProfile = await pool.query(
    'SELECT id, user_id FROM model_profiles WHERE id = $1',
    [id]
  );

  if (existingProfile.rows.length === 0) {
    throw new NotFoundError('Model profile not found');
  }

  if (existingProfile.rows[0].user_id !== req.user.id) {
    throw new ForbiddenError('Access denied');
  }

  // Build dynamic update query
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.provider !== undefined) {
    fields.push(`provider = $${paramCount++}`);
    values.push(updates.provider);
  }
  if (updates.endpoint !== undefined) {
    fields.push(`endpoint = $${paramCount++}`);
    values.push(updates.endpoint);
  }
  if (updates.model !== undefined) {
    fields.push(`model = $${paramCount++}`);
    values.push(updates.model);
  }
  if (updates.apiKey !== undefined) {
    fields.push(`api_key_encrypted = $${paramCount++}`);
    values.push(encrypt(updates.apiKey, ENCRYPTION_SECRET));
  }
  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramCount++}`);
    values.push(updates.enabled);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE model_profiles
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, name, provider, endpoint, model, enabled, created_at, updated_at`,
    values
  );

  res.json(successResponse({
    profile: result.rows[0],
  }));
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if profile exists and belongs to user
  const existingProfile = await pool.query(
    'SELECT id, user_id FROM model_profiles WHERE id = $1',
    [id]
  );

  if (existingProfile.rows.length === 0) {
    throw new NotFoundError('Model profile not found');
  }

  if (existingProfile.rows[0].user_id !== req.user.id) {
    throw new ForbiddenError('Access denied');
  }

  await pool.query('DELETE FROM model_profiles WHERE id = $1', [id]);

  res.json(successResponse(null, 'Model configuration deleted'));
});

// Helper function to get decrypted profile
export async function getDecryptedProfile(profileId, userId) {
  const result = await pool.query(
    `SELECT id, name, provider, endpoint, model, api_key_encrypted, enabled
     FROM model_profiles
     WHERE id = $1 AND user_id = $2`,
    [profileId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const profile = result.rows[0];
  profile.apiKey = decrypt(profile.api_key_encrypted, ENCRYPTION_SECRET);
  delete profile.api_key_encrypted;

  return profile;
}
