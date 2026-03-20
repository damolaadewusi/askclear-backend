import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export const registerUser = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const { rows: userCheck } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.length > 0) return res.status(400).json({ success: false, error: 'Email already registered.' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const { rows: rs } = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, token_balance) VALUES ($1, $2, $3, 10000) RETURNING id',
            [fullName, email, hashedPassword]
        );
        
        const { rows: newUser } = await pool.query('SELECT id, email, full_name, token_balance FROM users WHERE id = $1', [rs[0].id]);
        const user = newUser[0];
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'askclear_demo_secret_99', { expiresIn: '7d' });
        
        res.status(201).json({ success: true, token, user });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, error: `Postgres Error: ${error.message} [Code: ${error.code}]` });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows: result } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.length === 0) return res.status(400).json({ success: false, error: 'Invalid credentials.' });
        
        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid credentials.' });
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'askclear_demo_secret_99', { expiresIn: '7d' });
        res.status(200).json({ success: true, token, user });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: `Postgres Error: ${error.message} [Code: ${error.code}]` });
    }
};
