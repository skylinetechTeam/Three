# Exibição de Foto do Motorista para Passageiros

## 📋 Resumo
Implementada funcionalidade para exibir a foto do motorista quando um passageiro chama um carro. A foto é buscada automaticamente do Supabase usando informações do motorista.

## 🔧 Alterações Realizadas

### 1. **HomeScreen.js**
- **Importado componente `DriverAvatar`**
- **Substituído ícones genéricos por componente DriverAvatar em dois locais:**
  - Versão minimizada do dropdown (40px)
  - Versão expandida do dropdown (60px)
- **Ajustados estilos dos avatares**

### 2. **driverAuthService.js**
- **Atualizado método `getDriverPhotoUrl`** para buscar motorista por múltiplos campos:
  - Primeiro tenta por `id`
  - Se não encontrar, tenta por `tax_id`
  - Se não encontrar, tenta por `license_number` (placa vinda da API)

## 🎯 Como Funciona

### Fluxo de Exibição da Foto

1. **Passageiro solicita corrida**
2. **Motorista aceita a corrida**
3. **Evento `ride_accepted` é disparado com dados do motorista**
4. **HomeScreen extrai `driverId` dos dados:**
   ```javascript
   const driverData = {
     id: data.driverId || data.driver?.id || data.ride?.driverId,
     name: data.driverName || data.driver?.name,
     // ... outros dados
   };
   ```
5. **Componente DriverAvatar é renderizado com o `driverId`:**
   ```javascript
   <DriverAvatar 
     driverId={driverInfo.id}
     size={60}
     style={styles.driverAvatarLarge}
   />
   ```
6. **DriverAvatar busca a foto do Supabase:**
   - Chama `driverAuthService.getDriverPhotoUrl(driverId)`
   - Tenta buscar por `id`, `tax_id`, ou `license_number`
   - Se encontrar, retorna o `photo_url`
   - Se não encontrar ou der erro, exibe ícone padrão de pessoa

## 📸 Configuração Necessária no Supabase

### 1. Tabela `drivers`
Certifique-se de que a tabela tem a coluna `photo_url`:

```sql
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS photo_url TEXT;
```

### 2. Bucket `driver-photos`
O bucket já deve existir. Verifique as configurações:

```sql
-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'driver-photos';

-- Tornar o bucket público (se necessário)
UPDATE storage.buckets 
SET public = true 
WHERE name = 'driver-photos';
```

### 3. Políticas de Acesso (RLS)

```sql
-- Permitir leitura pública das fotos
CREATE POLICY "Public read access for driver photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-photos');

-- Permitir motoristas fazerem upload das próprias fotos
CREATE POLICY "Drivers can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'driver-photos');
```

## 🧪 Como Testar

### 1. Verificar se um motorista tem foto

```sql
-- Buscar motorista por ID
SELECT id, name, photo_url FROM drivers WHERE id = 'DRIVER_ID';

-- Buscar motorista por tax_id
SELECT id, name, photo_url FROM drivers WHERE tax_id = 'TAX_ID';

-- Buscar motorista por license_number (placa)
SELECT id, name, photo_url FROM drivers WHERE license_number = 'LD-123-AB';
```

### 2. Adicionar foto de teste para um motorista

```sql
UPDATE drivers 
SET photo_url = 'https://seu-projeto.supabase.co/storage/v1/object/public/driver-photos/drivers/test_driver.jpg'
WHERE id = 'DRIVER_ID';
```

### 3. No App
1. Login como passageiro
2. Solicite uma corrida
3. Aguarde um motorista aceitar (ou simule no modo dev)
4. Verifique se a foto do motorista aparece:
   - No dropdown minimizado (pequeno, 40px)
   - No dropdown expandido (grande, 60px)

## 🔍 Identificação do Motorista

O `driverId` que vem da API pode ser qualquer um dos seguintes:
- **ID primário** da tabela drivers
- **tax_id** (BI do motorista)
- **license_number** (placa do veículo, que é o `plate` da API)

O método `getDriverPhotoUrl` tenta todos esses campos automaticamente.

## 📱 Componente DriverAvatar

### Propriedades
```javascript
<DriverAvatar 
  driverId={string}      // ID do motorista (pode ser id, tax_id ou license_number)
  size={number}          // Tamanho do avatar em pixels (padrão: 50)
  style={object}         // Estilos adicionais
/>
```

### Estados do Componente
- **Loading**: Mostra ActivityIndicator enquanto busca a foto
- **Error/No Photo**: Mostra ícone de pessoa padrão
- **Success**: Mostra a foto do motorista

## 🎨 Customização

### Alterar tamanho dos avatares

No `HomeScreen.js`:

```javascript
// Avatar pequeno (minimizado)
<DriverAvatar 
  driverId={driverInfo.id}
  size={40}  // Altere aqui
  style={styles.driverAvatarSmall}
/>

// Avatar grande (expandido)
<DriverAvatar 
  driverId={driverInfo.id}
  size={60}  // Altere aqui
  style={styles.driverAvatarLarge}
/>
```

### Alterar ícone fallback

No `DriverAvatar.js` (linha 64):

```javascript
<Ionicons name="person" size={size * 0.6} color="#9CA3AF" />
// Altere "person" para outro ícone do Ionicons
```

## ⚠️ Troubleshooting

### Foto não aparece

1. **Verifique se o motorista tem photo_url no Supabase:**
   ```sql
   SELECT id, name, photo_url FROM drivers WHERE id = 'DRIVER_ID';
   ```

2. **Verifique se a URL é pública e acessível:**
   - Abra a URL do `photo_url` no navegador
   - Se der erro 403, o bucket não está público

3. **Verifique os logs do console:**
   - Procure por mensagens de erro do `driverAuthService`
   - Procure por "Erro ao carregar foto do motorista"

4. **Verifique o `driverId` que está sendo passado:**
   ```javascript
   console.log('🔍 Driver ID usado:', driverInfo.id);
   ```

### Foto carrega lentamente

- O componente já mostra um loading spinner
- Se a conexão for lenta, considere:
  - Redimensionar imagens no Supabase Storage
  - Usar CDN para as imagens
  - Implementar cache local

## ✅ Checklist de Implementação

- [x] Importar DriverAvatar no HomeScreen
- [x] Substituir ícones por DriverAvatar (versão minimizada)
- [x] Substituir ícones por DriverAvatar (versão expandida)
- [x] Atualizar estilos dos avatares
- [x] Atualizar getDriverPhotoUrl para buscar por múltiplos campos
- [ ] Testar com motorista real que tem foto
- [ ] Verificar configurações do Supabase Storage
- [ ] Verificar políticas RLS do bucket driver-photos

## 📝 Próximos Passos (Opcional)

1. **Cache de fotos**: Implementar cache local das fotos dos motoristas
2. **Placeholder personalizado**: Criar placeholder com iniciais do motorista
3. **Compressão de imagens**: Implementar upload com compressão automática
4. **Preview da foto**: Permitir passageiro ver foto maior ao tocar
