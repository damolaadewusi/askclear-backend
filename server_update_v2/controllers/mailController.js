import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import pkg from 'pg';
import { processDeepSeekExtraction } from './aiController.js';

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export const syncUniversalInbox = async (req, res) => {
    // Universal Payload to support ANY email provider globally.
    const { email, password, host, port, tls } = req.body;

    if(!email || !password || !host) {
        return res.status(400).json({ error: 'Missing IMAP credentials (email, password, host)' });
    }

    // Standard protocol configuration
    const config = {
        imap: { 
            user: email, 
            password: password, 
            host: host, 
            port: port || 993, 
            tls: tls !== false, 
            authTimeout: 10000 
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Pull unread actionable emails only
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true, markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);
        
        let extractedEmails = [];
        let asksExtractedCount = 0;

        for (let item of messages) {
            const headerPart = item.parts.find(p => p.which === 'HEADER');
            const textPart = item.parts.find(p => p.which === 'TEXT');
            
            let plainTextBody = "";
            if(textPart) {
                 const parsed = await simpleParser(textPart.body);
                 plainTextBody = parsed.text || String(textPart.body);
            }
            
            const subject = headerPart.body.subject?.[0] || 'No Subject';
            const from = headerPart.body.from?.[0] || 'Unknown Sender';
            const snippet = plainTextBody.substring(0, 1500);
            
            extractedEmails.push({
                subject,
                from,
                snippet // Pass safe chunk to DeepSeek
            });
            
            // DEEPSEEK EXTRACTION INFERENCE
            if(plainTextBody.length > 10) {
                try {
                    const aiData = await processDeepSeekExtraction(snippet);
                    if(aiData.has_ask) {
                        await pool.query(
                            'INSERT INTO user_asks (user_id, requestor, summary, urgency, recommended_action, source_snippet) VALUES ($1, $2, $3, $4, $5, $6)',
                            [req.user.id, aiData.requestor || from, aiData.summary, aiData.urgency || 'Medium', aiData.recommended_action || 'Review', plainTextBody.substring(0, 500)]
                        );
                        asksExtractedCount++;
                    }
                } catch(e) {
                    console.error('DeepSeek per-email failed:', e.message);
                }
            }
        }
        
        connection.end();
        
        // The pipeline now automatically persists to Supabase!
        res.status(200).json({ success: true, count: asksExtractedCount, scanned: extractedEmails.length, message: 'Inbox Synchronized!' });
    } catch (err) {
        console.error('[AskClear IMAP Engine] Sync Error:', err);
        res.status(500).json({ success: false, error: 'IMAP Authentication Failed. Check App Passwords or Host Settings.' });
    }
};
