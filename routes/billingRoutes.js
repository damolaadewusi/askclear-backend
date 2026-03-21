import express from 'express';
import { paystackWebhook, submitTokenOrder } from '../controllers/billingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/webhook/paystack', paystackWebhook);
router.post('/order', protect, submitTokenOrder);

export default router;
