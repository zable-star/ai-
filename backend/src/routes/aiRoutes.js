import express from 'express';
import { chat, refineImage } from '../controllers/aiController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware); // All AI routes require authentication

router.post('/chat', validate(schemas.aiChat), chat);
router.post('/refine-image', validate(schemas.aiRefineImage), refineImage);

export default router;
