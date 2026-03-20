import crypto from 'crypto';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export const paystackWebhook = async (req, res) => {
    try {
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                           .update(JSON.stringify(req.body))
                           .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
             console.warn('[AskClear SecOps] Rejected unauthorized webhook payload.');
             return res.status(403).send('Signature Verification Failed');
        }

        const event = req.body;
        
        if(event.event === 'charge.success') {
             const ref = event.data.reference;
             const email = event.data.customer.email;
             const amountGbp = event.data.amount / 100;
             const tokenDeposit = (amountGbp === 10) ? 10000 : 0;

             if(tokenDeposit > 0) {
                 await pool.query(
                     'UPDATE users SET token_balance = token_balance + $1 WHERE email = $2',
                     [tokenDeposit, email]
                 );
                 console.log(`[AskClear Economics] ${tokenDeposit} Tokens successfully provisioned for ${email} under ref: ${ref}`);
             }
        }
        res.status(200).send('Webhook Processed');
    } catch (error) {
        console.error('[AskClear Economics] Paystack Webhook Integrity Error:', error);
        res.status(500).send('Internal Error');
    }
};
