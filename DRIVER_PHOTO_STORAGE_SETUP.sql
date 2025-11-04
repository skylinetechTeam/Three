-- SQL para configurar Supabase Storage para fotos dos motoristas

-- 1) Adicionar coluna photo_url na tabela drivers
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2) Criar bucket 'driver-photos' no Supabase Storage
-- IMPORTANTE: Execute este comando no painel do Supabase em Storage > Create Bucket
-- Nome: driver-photos
-- Public: TRUE (para permitir acesso público às fotos)
-- 
-- Ou execute via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-photos', 'driver-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Políticas de acesso ao bucket (permitir upload e leitura)
-- Política para permitir upload autenticado
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-photos');

-- Política para permitir leitura pública
CREATE POLICY IF NOT EXISTS "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'driver-photos');

-- Política para permitir atualização autenticada
CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-photos')
WITH CHECK (bucket_id = 'driver-photos');

-- Política para permitir deleção autenticada  
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'driver-photos');

-- 4) Índice para melhorar performance na busca por photo_url
CREATE INDEX IF NOT EXISTS idx_drivers_photo_url
ON public.drivers (photo_url)
WHERE photo_url IS NOT NULL;

-- 5) Comentário no campo
COMMENT ON COLUMN public.drivers.photo_url IS 'URL pública da foto do motorista armazenada no Supabase Storage';

-- 6) Verificar estrutura (execute separadamente)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'drivers' AND table_schema = 'public'
-- AND column_name IN ('password_hash', 'photo_url', 'updated_at')
-- ORDER BY ordinal_position;
