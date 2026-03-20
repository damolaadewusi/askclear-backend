import express from 'express';
import { extractAsk, getUserAsks } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Single Email Inference Pipeline (Freeform)
router.post('/extract-ask', extractAsk);

// Fetch User's Aggregated Asks Dashboard
router.get('/asks', protect, getUserAsks);

export default router;
