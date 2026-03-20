import axios from 'axios';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const EXTRACT_PROMPT = `
You are an executive email intelligence engine.
Analyze the following email.
1. Determine if there is a primary "Ask" or action item.
2. If there is, identify the requestor, the summary, the urgency (Low/Medium/High), and recommended action (Approve, Delegate, Review).
3. IF THERE IS NO ASK, respond with { "has_ask": false }.
4. Otherwise, respond STRICTLY in JSON format matching this schema with no markdown formatting:
{
  "has_ask": true,
  "requestor": "Name",
  "summary": "Brief summary",
  "urgency": "High",
  "recommended_action": "Approve"
}

EMAIL CONTENT:
`;

export const processDeepSeekExtraction = async (plainTextBody) => {
    const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'You are an email parsing AI that outputs ONLY strict JSON representing actionable outcomes. Do not use markdown syntax. Do not output anything outside the JSON.' },
                { role: 'user', content: EXTRACT_PROMPT + plainTextBody }
            ],
            temperature: 0.1,
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    const aiOutput = response.data.choices[0].message.content;
    const cleanedJson = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
};

export const extractAsk = async (req, res) => {
    try {
        const { emailBody } = req.body;
        if (!emailBody) return res.status(400).json({ error: 'Missing emailBody payload.' });

        const parsedData = await processDeepSeekExtraction(emailBody);
        res.status(200).json({ success: true, data: parsedData });

    } catch (error) {
        console.error('[AskClear AI] DeepSeek Inference Error:', error.message);
        res.status(500).json({ success: false, error: 'Inference Engine Failure' });
    }
};

export const getUserAsks = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM user_asks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch Asks Error:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve AI data from database.' });
    }
};

export const archiveAsk = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE user_asks SET status = $1 WHERE id = $2 AND user_id = $3', ['archived', id, req.user.id]);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Database Archive Failed' });
    }
};

export const deleteAsk = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM user_asks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Database Delete Failed' });
    }
};
