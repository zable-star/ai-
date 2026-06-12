import express from 'express';
import { chat } from '../controllers/aiController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware); // All AI routes require authentication

router.post('/chat', validate(schemas.aiChat), chat);

export default router;
