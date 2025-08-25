-- Script SQL para inserir dados de exemplo no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- Primeiro, vamos criar as tabelas se não existirem (ajuste conforme sua estrutura)

-- Tabela de motoristas
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  license_number VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de veículos dos motoristas
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  license_plate VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir dados de exemplo de motoristas
INSERT INTO drivers (name, email, phone, password_hash, license_number, rating, total_trips, status) VALUES
('João Silva', 'joao.silva@email.com', '912345678', 'senha123', 'CNH123456789', 4.8, 142, 'active'),
('Maria Santos', 'maria.santos@email.com', '923456789', 'senha456', 'CNH987654321', 4.9, 98, 'active'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '934567890', 'senha789', 'CNH456789123', 4.7, 203, 'active'),
('Ana Costa', 'ana.costa@email.com', '945678901', NULL, 'CNH789123456', 4.6, 67, 'active'),
('Carlos Pereira', 'carlos.pereira@email.com', '956789012', 'senha321', 'CNH321654987', 4.9, 156, 'active')
ON CONFLICT (email) DO NOTHING;

-- Inserir dados de exemplo de veículos
INSERT INTO vehicles (driver_id, make, model, year, color, license_plate) VALUES
(1, 'Toyota', 'Corolla', 2020, 'Branco', 'ABC-1234'),
(2, 'Honda', 'Civic', 2019, 'Prata', 'DEF-5678'),
(3, 'Hyundai', 'HB20', 2021, 'Preto', 'GHI-9012'),
(4, 'Volkswagen', 'Gol', 2018, 'Azul', 'JKL-3456'),
(5, 'Chevrolet', 'Onix', 2022, 'Vermelho', 'MNO-7890')
ON CONFLICT DO NOTHING;

-- Atualizar os IDs dos motoristas nos veículos (caso necessário)
UPDATE vehicles SET driver_id = (
  SELECT id FROM drivers WHERE email = 'joao.silva@email.com'
) WHERE license_plate = 'ABC-1234';

UPDATE vehicles SET driver_id = (
  SELECT id FROM drivers WHERE email = 'maria.santos@email.com'
) WHERE license_plate = 'DEF-5678';

UPDATE vehicles SET driver_id = (
  SELECT id FROM drivers WHERE email = 'pedro.oliveira@email.com'
) WHERE license_plate = 'GHI-9012';

UPDATE vehicles SET driver_id = (
  SELECT id FROM drivers WHERE email = 'ana.costa@email.com'
) WHERE license_plate = 'JKL-3456';

UPDATE vehicles SET driver_id = (
  SELECT id FROM drivers WHERE email = 'carlos.pereira@email.com'
) WHERE license_plate = 'MNO-7890';

-- Verificar se os dados foram inseridos corretamente
SELECT 
  d.id,
  d.name,
  d.email,
  d.phone,
  CASE WHEN d.password_hash IS NOT NULL THEN 'Tem senha' ELSE 'Sem senha' END as password_status,
  d.rating,
  d.total_trips,
  v.make,
  v.model,
  v.year,
  v.color,
  v.license_plate
FROM drivers d
LEFT JOIN vehicles v ON d.id = v.driver_id
ORDER BY d.id;