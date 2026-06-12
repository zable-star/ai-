import express from 'express';
import { getProfiles, createProfile, updateProfile, deleteProfile } from '../controllers/modelController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware); // All model routes require authentication

router.get('/', getProfiles);
router.post('/', validate(schemas.createModelProfile), createProfile);
router.put('/:id', validate(schemas.updateModelProfile), updateProfile);
router.delete('/:id', deleteProfile);

export default router;
