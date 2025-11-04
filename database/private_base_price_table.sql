-- Tabela simples para configurar o preço base do táxi privado
-- Execute este script no SQL Editor do seu projeto Supabase

-- Criar tabela para preços base do privado
CREATE TABLE IF NOT EXISTS private_base_price (
  id SERIAL PRIMARY KEY,
  price_type VARCHAR(50) UNIQUE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_private_base_price_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_private_base_price
  BEFORE UPDATE ON private_base_price
  FOR EACH ROW
  EXECUTE FUNCTION update_private_base_price_updated_at();

-- Inserir preços padrão
INSERT INTO private_base_price (price_type, base_price, description) VALUES
('normal', 500.00, 'Preço base normal do privado'),
('peak_hours', 700.00, 'Preço base nas horas de pico (7h-9h e 17h-19h)'),
('end_of_month', 650.00, 'Preço base no fim do mês (últimos 5 dias)'),
('end_of_year', 800.00, 'Preço base no fim do ano (dezembro)'),
('weekend', 550.00, 'Preço base nos fins de semana'),
('night', 600.00, 'Preço base no período noturno (22h-6h)')
ON CONFLICT (price_type) DO NOTHING;

-- Visualizar dados inseridos
SELECT 
  id,
  price_type,
  base_price,
  description,
  is_active,
  updated_at
FROM private_base_price 
ORDER BY 
  CASE price_type
    WHEN 'normal' THEN 1
    WHEN 'peak_hours' THEN 2
    WHEN 'end_of_month' THEN 3
    WHEN 'end_of_year' THEN 4
    WHEN 'weekend' THEN 5
    WHEN 'night' THEN 6
  END;
