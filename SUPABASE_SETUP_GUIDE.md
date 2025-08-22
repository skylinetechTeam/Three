# 🚗 Guia de Setup Supabase - Sistema de Motoristas

Este guia explica como configurar o Supabase para o app de motoristas, focando no fluxo inteligente de login com foto e senha.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Executar Script SQL](#executar-script-sql)
3. [Configurar Storage](#configurar-storage)
4. [Instalar Dependências](#instalar-dependências)
5. [Configurar Variáveis](#configurar-variáveis)
6. [Fluxo de Autenticação](#fluxo-de-autenticação)
7. [Exemplos de Uso](#exemplos-de-uso)
8. [Troubleshooting](#troubleshooting)

## 🚀 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha sua organização
4. Defina o nome do projeto: `taxi-app-drivers`
5. Crie uma senha forte para o banco
6. Escolha a região mais próxima
7. Clique em "Create new project"

### 2. Obter Credenciais

Após criar o projeto, vá em **Settings > API** e copie:

- `Project URL` (ex: `https://xyzabc.supabase.co`)
- `anon/public key` (chave pública)

## 📊 Executar Script SQL

### 1. Acessar SQL Editor

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Cole todo o conteúdo do arquivo `supabase_setup.sql`
4. Clique em "Run" para executar

### 2. Verificar Criação das Tabelas

Vá em **Table Editor** e confirme que foram criadas:

- ✅ `drivers` - Tabela principal dos motoristas
- ✅ `driver_sessions` - Sessões de autenticação
- ✅ `driver_login_attempts` - Log de tentativas de login

### 3. Verificar Funções SQL

Vá em **Database > Functions** e confirme:

- ✅ `check_driver_login_status(text)`
- ✅ `save_driver_photo(text, text)`
- ✅ `set_driver_password(text, text)`
- ✅ `authenticate_driver(text, text)`
- ✅ `validate_driver_session(text)`
- ✅ `logout_driver(text)`

## 📁 Configurar Storage

### 1. Criar Bucket para Fotos

1. Vá em **Storage**
2. Clique em "New bucket"
3. Nome: `driver-photos`
4. Marque "Public bucket" ✅
5. Clique em "Create bucket"

### 2. Configurar Políticas de Storage

Execute este SQL adicional no **SQL Editor**:

```sql
-- Política para permitir upload de fotos
CREATE POLICY "Drivers can upload own photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'driver-photos');

-- Política para permitir visualização pública das fotos
CREATE POLICY "Public can view driver photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'driver-photos');

-- Política para permitir atualização de fotos próprias
CREATE POLICY "Drivers can update own photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'driver-photos');
```

## 📦 Instalar Dependências

No seu projeto React Native, instale:

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
```

## ⚙️ Configurar Variáveis

### 1. Atualizar `supabaseClient.js`

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "SUA_PROJECT_URL_AQUI";
const supabaseAnonKey = "SUA_ANON_KEY_AQUI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Adicionar ao `.env` (opcional)

```env
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 Fluxo de Autenticação

### Como Funciona o Login Inteligente

1. **Verificação Inicial**: Motorista digita email/telefone
2. **Checagem no Banco**: Sistema verifica se existe e qual o status
3. **Fluxo Dinâmico**:
   - Se não tem foto → Vai para tirar foto
   - Se tem foto mas não tem senha → Vai para definir senha  
   - Se tem foto e senha → Vai para login com senha
   - Se não existe → Mostra erro "not found"

### Estados Possíveis

| Cenário | Tem Foto? | Tem Senha? | Próximo Passo |
|---------|-----------|------------|---------------|
| Novo usuário | ❌ | ❌ | `TAKE_PHOTO` |
| Foto feita | ✅ | ❌ | `SET_PASSWORD` |
| Completo | ✅ | ✅ | `ENTER_PASSWORD` |
| Não existe | - | - | `DRIVER_NOT_FOUND` |

## 💻 Exemplos de Uso

### 1. Verificar Status do Motorista

```javascript
import supabaseDriverService from './services/supabaseDriverService';

const checkDriver = async () => {
  const result = await supabaseDriverService.checkDriverLoginStatus('912345678');
  
  if (result.success) {
    const { exists, next_step, name } = result.data;
    console.log(`Motorista: ${name}, Próximo passo: ${next_step}`);
  }
};
```

### 2. Salvar Foto do Motorista

```javascript
const savePhoto = async (photoUri) => {
  const result = await supabaseDriverService.saveDriverPhoto('912345678', photoUri);
  
  if (result.success) {
    console.log('Foto salva:', result.photoUrl);
  }
};
```

### 3. Definir Senha

```javascript
const setPassword = async (password) => {
  const result = await supabaseDriverService.setDriverPassword('912345678', password);
  
  if (result.success) {
    console.log('Senha definida com sucesso!');
  }
};
```

### 4. Fazer Login

```javascript
const login = async (emailOrPhone, password) => {
  const result = await supabaseDriverService.authenticateDriver(emailOrPhone, password);
  
  if (result.success && result.data.success) {
    const { driver, session_token } = result.data;
    console.log(`Bem-vindo, ${driver.name}!`);
    // Token salvo automaticamente no AsyncStorage
  }
};
```

### 5. Validar Sessão Ativa

```javascript
const checkSession = async () => {
  const isActive = await supabaseDriverService.hasActiveSession();
  
  if (isActive) {
    console.log('Usuário já está logado');
    // Pode navegar direto para área do motorista
  }
};
```

## 🔧 Troubleshooting

### Erro: "relation drivers does not exist"

**Causa**: Script SQL não foi executado corretamente.

**Solução**:
1. Vá no SQL Editor
2. Execute novamente o `supabase_setup.sql`
3. Verifique se não há erros de sintaxe

### Erro: "function check_driver_login_status does not exist"

**Causa**: Funções SQL não foram criadas.

**Solução**:
1. Execute apenas a parte das funções do script
2. Verifique em Database > Functions se apareceram

### Erro: "bucket driver-photos does not exist"

**Causa**: Bucket de storage não foi criado.

**Solução**:
1. Vá em Storage
2. Crie o bucket `driver-photos`
3. Marque como público

### Erro: "RLS policy violation"

**Causa**: Políticas de Row Level Security muito restritivas.

**Solução**:
1. Para desenvolvimento, desabilite RLS temporariamente:
```sql
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
```
2. Para produção, ajuste as políticas conforme necessário

### Upload de Foto Falha

**Causa**: Problemas de permissão ou configuração do Storage.

**Solução**:
1. Verifique se o bucket é público
2. Execute as políticas de storage mencionadas acima
3. Teste com uma imagem pequena primeiro

## 📱 Integração com o App

### 1. Substituir LocalDatabase

Substitua as chamadas do `LocalDatabase` por `supabaseDriverService`:

```javascript
// Antes
const profile = await LocalDatabase.getDriverProfile();

// Depois  
const session = await supabaseDriverService.validateSession();
const profile = session.data?.driver;
```

### 2. Gerenciar Estado Global

Considere usar Context API ou Redux para gerenciar o estado do motorista logado:

```javascript
// DriverContext.js
const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Lógica de autenticação...
};
```

## 📈 Próximos Passos

1. **Implementar Refresh Token**: Para renovar sessões expiradas
2. **Adicionar Biometria**: Para login mais rápido
3. **Sincronização Offline**: Para funcionar sem internet
4. **Analytics**: Para monitorar uso e erros
5. **Push Notifications**: Integrar com FCM/APNs

## 🔒 Segurança

### Recomendações de Produção

1. **Habilitar RLS**: Sempre em produção
2. **Rate Limiting**: Configurar no Supabase
3. **Logs de Auditoria**: Monitorar tentativas de login
4. **Backup Automático**: Configurar no painel
5. **SSL/TLS**: Sempre usar HTTPS

### Validações Adicionais

```sql
-- Limitar tentativas de login por IP
CREATE OR REPLACE FUNCTION check_login_attempts(ip_addr INET, email_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM driver_login_attempts
    WHERE ip_address = ip_addr 
    AND email_or_phone = email_phone
    AND success = false
    AND attempt_at > NOW() - INTERVAL '15 minutes';
    
    RETURN attempt_count < 5; -- Máximo 5 tentativas em 15 min
END;
$$ LANGUAGE plpgsql;
```

## 📞 Suporte

Para dúvidas sobre este setup:

1. Consulte a [documentação oficial do Supabase](https://supabase.com/docs)
2. Verifique os logs no painel do Supabase
3. Use o SQL Editor para testar queries manualmente
4. Monitore a aba Network no DevTools para erros de API

---

**✅ Setup Concluído!** 

Agora você tem um sistema completo de autenticação de motoristas com:
- ✅ Login inteligente baseado no status
- ✅ Upload seguro de fotos  
- ✅ Autenticação com senha criptografada
- ✅ Gestão de sessões
- ✅ Logs de segurança
- ✅ Políticas de acesso