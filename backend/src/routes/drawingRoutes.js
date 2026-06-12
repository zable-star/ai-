import express from 'express';
import { getDrawings, getDrawing, createDrawing, updateDrawing, deleteDrawing } from '../controllers/drawingController.js';
import { validate, schemas } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware); // All drawing routes require authentication

router.get('/', getDrawings);
router.post('/', validate(schemas.createDrawing), createDrawing);
router.get('/:id', getDrawing);
router.put('/:id', validate(schemas.updateDrawing), updateDrawing);
router.delete('/:id', deleteDrawing);

export default router;
