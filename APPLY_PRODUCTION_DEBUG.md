# 🔧 Como Aplicar o Debug de Produção

## 📋 Problema Identificado
As solicitações de corrida funcionam em desenvolvimento mas não chegam na API em produção.

## 🎯 Solução: Debug Detalhado

### 1. Adicionar o Debug ao HomeScreen.js

No arquivo `screens/HomeScreen.js`, adicione no topo do arquivo, logo após os outros imports:

```javascript
// Import do debug de produção
import ProductionDebug from '../DEBUG_PRODUCTION_REQUEST';
```

### 2. Ativar o Debug no useEffect de inicialização

Encontre o `useEffect` que inicializa o app (onde está o `connectSocket`) e adicione:

```javascript
useEffect(() => {
  // ... código existente ...
  
  // ATIVAR DEBUG EM PRODUÇÃO
  if (!__DEV__ || process.env.NODE_ENV === 'production') {
    console.log('🔧 Ativando debug de produção...');
    
    // Executar diagnóstico completo
    setTimeout(() => {
      ProductionDebug.runProductionDebug();
    }, 3000); // Aguardar 3 segundos para garantir que tudo está carregado
  }
  
  // ... resto do código ...
}, []);
```

### 3. Adicionar Debug ao Botão de Buscar Motorista

Na função `startDriverSearch`, adicione no início:

```javascript
const startDriverSearch = async () => {
  try {
    console.log('🚗 Iniciando busca de motoristas após confirmação...');
    
    // VERIFICAR AMBIENTE ANTES DE ENVIAR
    if (!__DEV__) {
      ProductionDebug.checkEnvironmentConfig();
      console.log('📍 URL que será usada:', `${API_CONFIG.API_BASE_URL}/rides/request`);
    }
    
    // ... resto do código ...
```

## 🧪 Como Testar

### Em Desenvolvimento:
1. Execute o app normalmente
2. Abra o console do desenvolvedor
3. Tente fazer uma solicitação de corrida
4. Observe os logs detalhados

### Em Produção:
1. Faça o build de produção: `eas build --platform android --profile production`
2. Instale o APK no dispositivo
3. Conecte o dispositivo via USB e use: `adb logcat | grep -i "console"`
4. Ou use o Expo DevTools para ver os logs remotos

## 📊 O que o Debug Mostra

1. **Configuração de Ambiente:**
   - URLs configuradas (API_BASE_URL, SOCKET_URL)
   - Variáveis de ambiente
   - Detecção de produção/desenvolvimento

2. **Interceptação de Fetch:**
   - Todas as requisições HTTP
   - Headers enviados
   - Respostas recebidas
   - Tempos de resposta
   - Erros detalhados

3. **Análise de createRideRequest:**
   - Dados enviados
   - URL completa
   - Resposta ou erro específico

4. **Monitor de WebSocket:**
   - Estado da conexão
   - Eventos enviados e recebidos
   - Reconexões

## 🚨 Possíveis Problemas e Soluções

### 1. URL Incorreta em Produção
**Sintoma:** Logs mostram URL com localhost ou ngrok
**Solução:** 
```javascript
// Criar arquivo .env.production
EXPO_PUBLIC_API_URL=https://three-api-9fac.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://three-api-9fac.onrender.com
```

### 2. CORS Bloqueando Requisições
**Sintoma:** Erro "Failed to fetch" ou "Network request failed"
**Solução:** No servidor, adicionar headers CORS:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### 3. Certificado SSL Inválido
**Sintoma:** Erro de SSL/TLS
**Solução:** Usar certificado válido ou temporariamente permitir certificados auto-assinados

### 4. API Timeout em Produção
**Sintoma:** Requisições demoram muito e falham
**Solução:** Aumentar timeout no config/api.js:
```javascript
REQUEST_TIMEOUT: 30000, // 30 segundos
```

## 📝 Checklist de Verificação

- [ ] As URLs estão corretas para produção?
- [ ] O servidor está rodando e acessível?
- [ ] CORS está configurado corretamente?
- [ ] As variáveis de ambiente estão definidas?
- [ ] O certificado SSL é válido?
- [ ] O firewall não está bloqueando?
- [ ] A rede do dispositivo tem acesso à internet?

## 🔍 Análise dos Logs

Após executar com o debug, procure por:

1. **🔵 [FETCH #X]** - Mostra cada requisição HTTP
2. **🚨 REQUISIÇÃO DE CORRIDA DETECTADA** - Confirma que a solicitação foi tentada
3. **❌ ERRO NA REQUISIÇÃO** - Detalhes do erro
4. **📍 API_BASE_URL** - Confirma qual URL está sendo usada

## 💡 Dica Extra

Se o problema persistir, teste a API diretamente do dispositivo:

```bash
# No terminal do computador com o dispositivo conectado
adb shell

# No shell do dispositivo
curl -X POST https://three-api-9fac.onrender.com/api/rides/request \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Isso confirma se o dispositivo consegue alcançar a API independentemente do app.

## 🆘 Suporte

Se após aplicar o debug você ainda tiver problemas:
1. Copie todos os logs relevantes
2. Note especificamente onde o processo falha
3. Verifique se há diferenças entre dev e prod nos logs
4. Considere usar uma ferramenta como Charles Proxy ou Postman para interceptar as requisições

O debug fornecerá informações detalhadas sobre exatamente onde e por que as requisições estão falhando em produção!