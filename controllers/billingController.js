import crypto from 'crypto';
import pkg from 'pg';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
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

export const submitTokenOrder = async (req, res) => {
    try {
        const { package_name } = req.body;
        await pool.query(
            'INSERT INTO billing_requests (user_id, user_email, package_name) VALUES ($1, $2, $3)',
            [req.user.id, req.user.email, package_name]
        );

        // Emit response immediately to prevent frontend hanging
        res.status(200).json({ success: true, message: 'Order submitted to Supabase successfully' });

        try {
            if (process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_SMTP_USER,
                        pass: process.env.GMAIL_SMTP_PASS
                    }
                });
                // Background execution (No await)
                transporter.sendMail({
                    from: `"AskClear Economics" <${process.env.GMAIL_SMTP_USER}>`,
                    to: 'damola.adewusi@gmail.com',
                    subject: `[AskClear Token Request] ${req.user.email}`,
                    text: `URGENT: User ${req.user.email} (ID: ${req.user.id}) has requested a token restock.\n\nPackage Selected: ${package_name}\n\nPlease contact them to arrange payment and manually credit their token_balance.`
                }).then(() => {
                    console.log(`[AskClear Economics] Notified Admin of order from ${req.user.email}`);
                }).catch(mailErr => {
                    console.error('[AskClear Economics] SMTP Auth or Dispatch failed:', mailErr);
                });
            } else {
                console.warn('[AskClear Economics] Skipping Admin Email Alert: GMAIL_SMTP_USER env variable missing.');
            }
        } catch (mailSetupErr) {
            console.error('[AskClear Economics] Mail Setup Error:', mailSetupErr);
        }
    } catch (error) {
        console.error('Order Submit Error:', error);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
};
