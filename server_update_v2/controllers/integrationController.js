import axios from 'axios';

// Asana Pipeline Push
export const pushToAsana = async (req, res) => {
    try {
        const { askId, asanaToken, workspaceId, projectId, taskName, notes } = req.body;
        
        // Push the extracted 'Ask' directly to an Asana Project
        const response = await axios.post('https://app.asana.com/api/1.0/tasks', {
            data: {
                workspace: workspaceId,
                projects: [projectId],
                name: taskName,
                notes: notes
            }
        }, {
            headers: { 'Authorization': `Bearer ${asanaToken}` }
        });
        
        /* 
           PRODUCTION DB INJECTION:
           await pool.query('UPDATE extracted_asks SET status = $1 WHERE id = $2', ['DELEGATED', askId]);
        */

        res.status(200).json({ success: true, asanaTask: response.data.data });
    } catch (e) {
        console.error('[AskClear Integrations] Asana Push Failed:', e?.response?.data || e.message);
        res.status(500).json({ success: false, error: 'Asana Integration Failed' });
    }
};

// Jira Ticket Push
export const pushToJira = async (req, res) => {
    try {
        const { jiraUrl, jiraEmail, jiraToken, projectKey, summary, description } = req.body;
        
        const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

        const response = await axios.post(`${jiraUrl}/rest/api/3/issue`, {
            fields: {
                project: { key: projectKey },
                summary: summary,
                description: {
                    type: "doc",
                    version: 1,
                    content: [{ type: "paragraph", content: [{ text: description, type: "text" }] }]
                },
                issuetype: { name: "Task" }
            }
        }, {
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
        });

        res.status(200).json({ success: true, jiraTask: response.data });
    } catch (e) {
        console.error('[AskClear Integrations] Jira Push Failed:', e?.response?.data || e.message);
        res.status(500).json({ success: false, error: 'Jira Integration Failed' });
    }
};
