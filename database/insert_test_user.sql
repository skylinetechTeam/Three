-- Insert test user for login testing
-- Run this script in your Supabase SQL Editor

-- First ensure the users table exists (using the no-salt version)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_or_telefone_required CHECK (
        (email IS NOT NULL) OR (telefone IS NOT NULL)
    ),
    CONSTRAINT email_unique UNIQUE (email),
    CONSTRAINT telefone_unique UNIQUE (telefone)
);

-- Insert a test user
-- Password for this user will be "123456"
-- The hash is generated using: sha256("123456" + "TRAVEL_APP_SECRET_2024") encoded in Base64
INSERT INTO users (nome, email, telefone, senha) 
VALUES (
    'Usuário Teste',
    'teste@email.com',
    '928873593',
    'eXLltcuN3OUWoAg0mfNKnbUzLKB5D8+DqKLlcIcNqfo='
) 
ON CONFLICT (email) DO NOTHING;

-- Verify the user was inserted
SELECT id, nome, email, telefone, created_at 
FROM users 
WHERE email = 'teste@email.com' OR telefone = '928873593';