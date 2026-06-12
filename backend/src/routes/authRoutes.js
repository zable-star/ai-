import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
