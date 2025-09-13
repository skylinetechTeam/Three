-- SQL Script para criar tabela de usuários sem coluna salt
-- Execute este script no SQL Editor do seu projeto Supabase

-- Remover tabela existente se necessário (CUIDADO: isso apagará todos os dados)
-- DROP TABLE IF EXISTS users;

-- Criar tabela de usuários
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

-- Índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_telefone ON users(telefone) WHERE telefone IS NOT NULL;

-- Trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema (sem salt)';
COMMENT ON COLUMN users.id IS 'Identificador único do usuário';
COMMENT ON COLUMN users.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN users.email IS 'Email do usuário (opcional se telefone preenchido)';
COMMENT ON COLUMN users.telefone IS 'Número de telefone do usuário (opcional se email preenchido)';
COMMENT ON COLUMN users.senha IS 'Senha criptografada do usuário (com hash fixo)';
COMMENT ON COLUMN users.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN users.updated_at IS 'Data e hora da última atualização do registro';