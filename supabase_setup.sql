-- =====================================================
-- SETUP SUPABASE PARA APP DE MOTORISTAS
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de motoristas (drivers)
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dados básicos (vindos do outro sistema)
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    license_number VARCHAR(20) UNIQUE,
    
    -- Dados do veículo
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INTEGER,
    vehicle_color VARCHAR(30),
    vehicle_plate VARCHAR(15),
    
    -- Campos específicos do app (foto e senha)
    photo_url TEXT,
    password_hash TEXT, -- Hash da senha
    has_password BOOLEAN DEFAULT FALSE, -- Flag se já definiu senha
    
    -- Status e localização
    is_online BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'available', -- available, busy, offline
    current_location JSONB, -- {lat: number, lng: number}
    last_location_update TIMESTAMPTZ,
    
    -- Métricas
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_rides INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Índices para performance
    CONSTRAINT drivers_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
    CONSTRAINT drivers_phone_check CHECK (phone ~ '^[0-9+\-\s()]+$'),
    CONSTRAINT drivers_rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- Tabela de sessões de motoristas
CREATE TABLE IF NOT EXISTS public.driver_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de tentativas de login (segurança)
CREATE TABLE IF NOT EXISTS public.driver_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_or_phone VARCHAR(100) NOT NULL,
    ip_address INET,
    success BOOLEAN DEFAULT FALSE,
    attempt_at TIMESTAMPTZ DEFAULT NOW(),
    error_reason TEXT
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_online_status ON public.drivers(is_online, status);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers USING GIN(current_location);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_token ON public.driver_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_expires ON public.driver_sessions(expires_at);

-- =====================================================
-- TRIGGERS PARA AUTO-UPDATE
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para drivers
CREATE TRIGGER update_drivers_updated_at 
    BEFORE UPDATE ON public.drivers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÕES DE AUTENTICAÇÃO E LOGIN
-- =====================================================

-- Função para verificar se motorista existe e status da senha
CREATE OR REPLACE FUNCTION check_driver_login_status(input_email_or_phone TEXT)
RETURNS JSON AS $$
DECLARE
    driver_record RECORD;
    result JSON;
BEGIN
    -- Buscar motorista por email ou telefone
    SELECT id, name, email, phone, has_password, photo_url, is_online
    INTO driver_record
    FROM public.drivers 
    WHERE email = input_email_or_phone OR phone = input_email_or_phone;
    
    -- Se não encontrou o motorista
    IF NOT FOUND THEN
        result := json_build_object(
            'exists', false,
            'error', 'DRIVER_NOT_FOUND',
            'message', 'Motorista não encontrado no sistema'
        );
        
        -- Registrar tentativa de login falhada
        INSERT INTO public.driver_login_attempts (email_or_phone, success, error_reason)
        VALUES (input_email_or_phone, false, 'DRIVER_NOT_FOUND');
        
        RETURN result;
    END IF;
    
    -- Motorista existe
    result := json_build_object(
        'exists', true,
        'driver_id', driver_record.id,
        'name', driver_record.name,
        'email', driver_record.email,
        'phone', driver_record.phone,
        'has_password', driver_record.has_password,
        'has_photo', CASE WHEN driver_record.photo_url IS NOT NULL THEN true ELSE false END,
        'is_online', driver_record.is_online,
        'next_step', CASE 
            WHEN driver_record.photo_url IS NULL THEN 'TAKE_PHOTO'
            WHEN NOT driver_record.has_password THEN 'SET_PASSWORD'
            ELSE 'ENTER_PASSWORD'
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para salvar foto do motorista
CREATE OR REPLACE FUNCTION save_driver_photo(
    driver_email_or_phone TEXT,
    photo_url_param TEXT
)
RETURNS JSON AS $$
DECLARE
    driver_id_var UUID;
    result JSON;
BEGIN
    -- Buscar ID do motorista
    SELECT id INTO driver_id_var
    FROM public.drivers 
    WHERE email = driver_email_or_phone OR phone = driver_email_or_phone;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'DRIVER_NOT_FOUND',
            'message', 'Motorista não encontrado'
        );
    END IF;
    
    -- Atualizar foto
    UPDATE public.drivers 
    SET photo_url = photo_url_param,
        updated_at = NOW()
    WHERE id = driver_id_var;
    
    result := json_build_object(
        'success', true,
        'driver_id', driver_id_var,
        'message', 'Foto salva com sucesso'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para definir senha do motorista
CREATE OR REPLACE FUNCTION set_driver_password(
    driver_email_or_phone TEXT,
    new_password TEXT
)
RETURNS JSON AS $$
DECLARE
    driver_id_var UUID;
    password_hash_var TEXT;
    result JSON;
BEGIN
    -- Validar senha (mínimo 6 caracteres)
    IF LENGTH(new_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'PASSWORD_TOO_SHORT',
            'message', 'A senha deve ter pelo menos 6 caracteres'
        );
    END IF;
    
    -- Buscar ID do motorista
    SELECT id INTO driver_id_var
    FROM public.drivers 
    WHERE email = driver_email_or_phone OR phone = driver_email_or_phone;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'DRIVER_NOT_FOUND',
            'message', 'Motorista não encontrado'
        );
    END IF;
    
    -- Gerar hash da senha
    password_hash_var := crypt(new_password, gen_salt('bf'));
    
    -- Atualizar senha
    UPDATE public.drivers 
    SET password_hash = password_hash_var,
        has_password = true,
        updated_at = NOW()
    WHERE id = driver_id_var;
    
    result := json_build_object(
        'success', true,
        'driver_id', driver_id_var,
        'message', 'Senha definida com sucesso'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para autenticar motorista com senha
CREATE OR REPLACE FUNCTION authenticate_driver(
    driver_email_or_phone TEXT,
    password_input TEXT
)
RETURNS JSON AS $$
DECLARE
    driver_record RECORD;
    session_token_var TEXT;
    result JSON;
BEGIN
    -- Buscar motorista e verificar senha
    SELECT id, name, email, phone, password_hash, has_password, photo_url
    INTO driver_record
    FROM public.drivers 
    WHERE (email = driver_email_or_phone OR phone = driver_email_or_phone)
    AND has_password = true;
    
    -- Se não encontrou ou não tem senha definida
    IF NOT FOUND THEN
        INSERT INTO public.driver_login_attempts (email_or_phone, success, error_reason)
        VALUES (driver_email_or_phone, false, 'INVALID_CREDENTIALS');
        
        RETURN json_build_object(
            'success', false,
            'error', 'INVALID_CREDENTIALS',
            'message', 'Email/telefone ou senha incorretos'
        );
    END IF;
    
    -- Verificar senha
    IF NOT (driver_record.password_hash = crypt(password_input, driver_record.password_hash)) THEN
        INSERT INTO public.driver_login_attempts (email_or_phone, success, error_reason)
        VALUES (driver_email_or_phone, false, 'WRONG_PASSWORD');
        
        RETURN json_build_object(
            'success', false,
            'error', 'WRONG_PASSWORD',
            'message', 'Senha incorreta'
        );
    END IF;
    
    -- Gerar token de sessão
    session_token_var := encode(gen_random_bytes(32), 'hex');
    
    -- Criar sessão
    INSERT INTO public.driver_sessions (driver_id, session_token, expires_at)
    VALUES (driver_record.id, session_token_var, NOW() + INTERVAL '30 days');
    
    -- Atualizar último login
    UPDATE public.drivers 
    SET last_login = NOW(),
        is_online = true,
        updated_at = NOW()
    WHERE id = driver_record.id;
    
    -- Registrar login bem-sucedido
    INSERT INTO public.driver_login_attempts (email_or_phone, success)
    VALUES (driver_email_or_phone, true);
    
    result := json_build_object(
        'success', true,
        'driver', json_build_object(
            'id', driver_record.id,
            'name', driver_record.name,
            'email', driver_record.email,
            'phone', driver_record.phone,
            'photo_url', driver_record.photo_url
        ),
        'session_token', session_token_var,
        'expires_at', (NOW() + INTERVAL '30 days')::text,
        'message', 'Login realizado com sucesso'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para validar sessão
CREATE OR REPLACE FUNCTION validate_driver_session(token TEXT)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    driver_record RECORD;
    result JSON;
BEGIN
    -- Buscar sessão ativa
    SELECT ds.*, d.name, d.email, d.phone, d.photo_url
    INTO session_record
    FROM public.driver_sessions ds
    JOIN public.drivers d ON ds.driver_id = d.id
    WHERE ds.session_token = token 
    AND ds.is_active = true 
    AND ds.expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'INVALID_SESSION',
            'message', 'Sessão inválida ou expirada'
        );
    END IF;
    
    result := json_build_object(
        'valid', true,
        'driver', json_build_object(
            'id', session_record.driver_id,
            'name', session_record.name,
            'email', session_record.email,
            'phone', session_record.phone,
            'photo_url', session_record.photo_url
        ),
        'session_id', session_record.id,
        'expires_at', session_record.expires_at::text
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para logout (invalidar sessão)
CREATE OR REPLACE FUNCTION logout_driver(token TEXT)
RETURNS JSON AS $$
BEGIN
    UPDATE public.driver_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE session_token = token;
    
    -- Marcar motorista como offline
    UPDATE public.drivers 
    SET is_online = false, updated_at = NOW()
    WHERE id IN (
        SELECT driver_id FROM public.driver_sessions 
        WHERE session_token = token
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Logout realizado com sucesso'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_login_attempts ENABLE ROW LEVEL SECURITY;

-- Política para drivers: podem ver e editar apenas seus próprios dados
CREATE POLICY "Drivers can view own data" ON public.drivers
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Drivers can update own data" ON public.drivers
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Política para sessões: podem ver apenas suas próprias sessões
CREATE POLICY "Drivers can view own sessions" ON public.driver_sessions
    FOR SELECT USING (auth.uid()::text = driver_id::text);

-- =====================================================
-- DADOS DE EXEMPLO PARA TESTE
-- =====================================================

-- Inserir alguns motoristas de exemplo (sem senha inicialmente)
INSERT INTO public.drivers (name, email, phone, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate)
VALUES 
    ('João Silva', 'joao.motorista@email.com', '912345678', 'CNH123456789', 'Toyota', 'Corolla', 2020, 'Branco', 'LD-12-34-AB'),
    ('Maria Santos', 'maria.driver@email.com', '923456789', 'CNH987654321', 'Honda', 'Civic', 2021, 'Prata', 'LD-56-78-CD'),
    ('Pedro Costa', 'pedro.taxi@email.com', '934567890', 'CNH456789123', 'Volkswagen', 'Jetta', 2019, 'Preto', 'LD-90-12-EF')
ON CONFLICT (phone) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.drivers IS 'Tabela principal dos motoristas com dados básicos, foto e senha';
COMMENT ON TABLE public.driver_sessions IS 'Sessões ativas dos motoristas para autenticação';
COMMENT ON TABLE public.driver_login_attempts IS 'Log de tentativas de login para segurança';

COMMENT ON FUNCTION check_driver_login_status(TEXT) IS 'Verifica se motorista existe e qual o próximo passo (foto, senha, ou login)';
COMMENT ON FUNCTION save_driver_photo(TEXT, TEXT) IS 'Salva a foto do motorista';
COMMENT ON FUNCTION set_driver_password(TEXT, TEXT) IS 'Define a senha do motorista';
COMMENT ON FUNCTION authenticate_driver(TEXT, TEXT) IS 'Autentica motorista com email/telefone e senha';
COMMENT ON FUNCTION validate_driver_session(TEXT) IS 'Valida token de sessão do motorista';
COMMENT ON FUNCTION logout_driver(TEXT) IS 'Faz logout do motorista invalidando a sessão';

-- =====================================================
-- EXEMPLO DE USO DAS FUNÇÕES
-- =====================================================

/*
-- 1. Verificar status de login de um motorista
SELECT check_driver_login_status('912345678');

-- 2. Salvar foto do motorista
SELECT save_driver_photo('912345678', 'https://storage.supabase.co/bucket/photos/driver_123.jpg');

-- 3. Definir senha do motorista
SELECT set_driver_password('912345678', 'minhasenha123');

-- 4. Autenticar motorista
SELECT authenticate_driver('912345678', 'minhasenha123');

-- 5. Validar sessão
SELECT validate_driver_session('token_da_sessao_aqui');

-- 6. Fazer logout
SELECT logout_driver('token_da_sessao_aqui');
*/