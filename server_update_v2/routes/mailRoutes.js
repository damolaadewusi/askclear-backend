import express from 'express';
import { syncUniversalInbox } from '../controllers/mailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Universal IMAP Interceptor Route
router.post('/sync', protect, syncUniversalInbox);

export default router;
