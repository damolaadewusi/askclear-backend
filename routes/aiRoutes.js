import express from 'express';
import { extractAsk } from '../controllers/aiController.js';

const router = express.Router();

router.post('/extract-ask', extractAsk);

export default router;
