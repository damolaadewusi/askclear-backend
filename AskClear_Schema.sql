-- AskClear AI | Core PostgreSQL Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255),
    google_oauth_token TEXT,
    token_balance INT DEFAULT 10000,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE extracted_asks (
    id SERIAL PRIMARY KEY,
    user_id INT,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(150),
    subject TEXT,
    raw_body TEXT,
    extracted_intent TEXT NOT NULL,
    urgency_level VARCHAR(50) DEFAULT 'Normal',
    suggested_action VARCHAR(50) DEFAULT 'Review',
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE token_ledger (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    tokens_consumed INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
