import express from 'express';
import { syncUniversalInbox } from '../controllers/mailController.js';

const router = express.Router();

// Universal IMAP Interceptor Route
router.post('/sync', syncUniversalInbox);

export default router;
