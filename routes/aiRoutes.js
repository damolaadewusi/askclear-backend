import express from 'express';
import { extractAsk, getUserAsks, archiveAsk, deleteAsk } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Single Email Inference Pipeline (Freeform)
router.post('/extract-ask', extractAsk);

// Fetch User's Aggregated Asks Dashboard
router.get('/asks', protect, getUserAsks);
router.put('/asks/:id/archive', protect, archiveAsk);
router.delete('/asks/:id', protect, deleteAsk);

export default router;
