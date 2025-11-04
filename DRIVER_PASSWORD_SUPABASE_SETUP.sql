-- SQL para configurar campo de senha dos motoristas no Supabase

-- 1) Adicionar campo password_hash na tabela drivers (se não existir)
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2) Adicionar campo updated_at (opcional, para auditoria)
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4) Criar índice para melhorar performance na busca por password_hash
CREATE INDEX IF NOT EXISTS idx_drivers_password_hash 
ON public.drivers (password_hash) 
WHERE password_hash IS NOT NULL;

-- 5) Comentário no campo para documentar
COMMENT ON COLUMN public.drivers.password_hash IS 'Hash SHA-256 da senha do motorista usando mesmo salt dos usuários';

-- 4) Verificar estrutura da tabela
-- (Execute esta query separadamente para ver os campos)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'drivers' AND table_schema = 'public'
-- ORDER BY ordinal_position;