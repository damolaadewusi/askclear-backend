import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

export const registerUser = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const [userCheck] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (userCheck.length > 0) return res.status(400).json({ success: false, error: 'Email already registered.' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [rs] = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, token_balance) VALUES (?, ?, ?, 10000)',
            [fullName, email, hashedPassword]
        );
        
        const [newUser] = await pool.query('SELECT id, email, full_name, token_balance FROM users WHERE id = ?', [rs.insertId]);
        const user = newUser[0];
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'askclear_demo_secret_99', { expiresIn: '7d' });
        
        res.status(201).json({ success: true, token, user });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, error: `MySQL Error: ${error.message} [Code: ${error.code}]` });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [result] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (result.length === 0) return res.status(400).json({ success: false, error: 'Invalid credentials.' });
        
        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid credentials.' });
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'askclear_demo_secret_99', { expiresIn: '7d' });
        res.status(200).json({ success: true, token, user });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: `MySQL Error: ${error.message} [Code: ${error.code}]` });
    }
};
