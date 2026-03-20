import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

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

        for (let item of messages) {
            const headerPart = item.parts.find(p => p.which === 'HEADER');
            const textPart = item.parts.find(p => p.which === 'TEXT');
            
            let plainTextBody = "";
            if(textPart) {
                 const parsed = await simpleParser(textPart.body);
                 plainTextBody = parsed.text || String(textPart.body);
            }
            
            extractedEmails.push({
                subject: headerPart.body.subject?.[0] || 'No Subject',
                from: headerPart.body.from?.[0] || 'Unknown Sender',
                snippet: plainTextBody.substring(0, 1500) // Pass safe chunk to DeepSeek
            });
        }
        
        connection.end();
        
        // In the true Production Cron, 'extractedEmails' array loops directly into aiController.js here.
        res.status(200).json({ success: true, count: extractedEmails.length, unread_threads: extractedEmails });
    } catch (err) {
        console.error('[AskClear IMAP Engine] Sync Error:', err);
        res.status(500).json({ success: false, error: 'IMAP Authentication Failed. Check App Passwords or Host Settings.' });
    }
};
