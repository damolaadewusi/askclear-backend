import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

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

export const extractAsk = async (req, res) => {
    try {
        const { emailBody } = req.body;
        
        if (!emailBody) {
            return res.status(400).json({ error: 'Missing emailBody payload.' });
        }

        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are an email parsing AI that outputs ONLY strict JSON representing actionable outcomes. Do not use markdown syntax.' },
                    { role: 'user', content: EXTRACT_PROMPT + emailBody }
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
        
        // Defensive parsing for LLM markdown wrappers
        const cleanedJson = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanedJson);

        res.status(200).json({ success: true, data: parsedData });

    } catch (error) {
        console.error('[AskClear AI] DeepSeek Inference Error:', error.message);
        res.status(500).json({ success: false, error: 'Inference Engine Failure' });
    }
};
