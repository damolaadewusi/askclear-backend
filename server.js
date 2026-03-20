import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import authRoutes from './routes/authRoutes.js'; 

dotenv.config();
const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE ENGINE ---
// Connection pools are securely isolated natively within individual authenticated controllers (mysql2)

// --- API ROUTES ---
app.use('/api/ai', aiRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/auth', authRoutes);

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Online', service: 'AskClear AI Engine', version: '1.0.0' });
});

// --- INIT SERVER ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[AskClear AI] Engine engaged on port ${PORT}`);
});
