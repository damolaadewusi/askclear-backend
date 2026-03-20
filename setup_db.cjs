const pkg = require('pg');
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://postgres.xabsqmxlclbwpbeaqksy:AskClearDatabase2026Secure@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_asks (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                requestor VARCHAR(255),
                summary TEXT,
                urgency VARCHAR(50),
                recommended_action VARCHAR(255),
                source_snippet TEXT,
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database table user_asks initialized successfully on Supabase.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

initDB();
