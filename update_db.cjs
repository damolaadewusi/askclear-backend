require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function upgradeDB() {
    try {
        console.log('Connecting to Supabase...');
        const client = await pool.connect();
        
        // Check if column exists, if not add it
        await client.query(`
            ALTER TABLE user_asks 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
        `);
        
        console.log('Column status added successfully!');
        client.release();
    } catch (err) {
        console.error('Error upgrading DB:', err);
    } finally {
        pool.end();
    }
}

upgradeDB();
