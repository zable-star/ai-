import pool from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

export const getDrawings = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM drawings WHERE user_id = $1',
    [req.user.id]
  );

  const result = await pool.query(
    `SELECT id, name, actions, thumbnail, created_at, updated_at
     FROM drawings
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  res.json(successResponse({
    drawings: result.rows,
    total: parseInt(countResult.rows[0].count),
  }));
});

export const getDrawing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT id, name, actions, thumbnail, created_at, updated_at
     FROM drawings
     WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Drawing not found');
  }

  res.json(successResponse({
    drawing: result.rows[0],
  }));
});

export const createDrawing = asyncHandler(async (req, res) => {
  const { name, actions, thumbnail } = req.body;

  const result = await pool.query(
    `INSERT INTO drawings (user_id, name, actions, thumbnail)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, actions, thumbnail, created_at, updated_at`,
    [req.user.id, name, JSON.stringify(actions), thumbnail || null]
  );

  res.status(201).json(successResponse({
    drawing: result.rows[0],
  }));
});

export const updateDrawing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if drawing exists and belongs to user
  const existingDrawing = await pool.query(
    'SELECT id, user_id FROM drawings WHERE id = $1',
    [id]
  );

  if (existingDrawing.rows.length === 0) {
    throw new NotFoundError('Drawing not found');
  }

  if (existingDrawing.rows[0].user_id !== req.user.id) {
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
  if (updates.actions !== undefined) {
    fields.push(`actions = $${paramCount++}`);
    values.push(JSON.stringify(updates.actions));
  }
  if (updates.thumbnail !== undefined) {
    fields.push(`thumbnail = $${paramCount++}`);
    values.push(updates.thumbnail || null);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE drawings
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, name, actions, thumbnail, created_at, updated_at`,
    values
  );

  res.json(successResponse({
    drawing: result.rows[0],
  }));
});

export const deleteDrawing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if drawing exists and belongs to user
  const existingDrawing = await pool.query(
    'SELECT id, user_id FROM drawings WHERE id = $1',
    [id]
  );

  if (existingDrawing.rows.length === 0) {
    throw new NotFoundError('Drawing not found');
  }

  if (existingDrawing.rows[0].user_id !== req.user.id) {
    throw new ForbiddenError('Access denied');
  }

  await pool.query('DELETE FROM drawings WHERE id = $1', [id]);

  res.json(successResponse(null, 'Drawing deleted'));
});
