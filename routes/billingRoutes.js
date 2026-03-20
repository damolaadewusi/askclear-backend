import express from 'express';
import { paystackWebhook } from '../controllers/billingController.js';

const router = express.Router();

router.post('/webhook/paystack', paystackWebhook);

export default router;
