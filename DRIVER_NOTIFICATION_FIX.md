# Correção do Sistema de Notificações para Motoristas

## Problema Identificado

O sistema não estava enviando notificações de corridas para os motoristas devido a dois problemas principais:

### 1. Conflito de Rotas no Backend
- A rota `/api/rides/pending` estava sendo interceptada pela rota `/api/rides/:id`
- Isso fazia com que qualquer requisição para `/pending` fosse tratada como uma busca por ID
- **Solução**: Movida a rota `/pending` para antes da rota `/:id` no arquivo `/api/routes/rides.js`

### 2. Configuração de URL Incorreta
- O app estava configurado para usar uma URL do ngrok que não estava ativa
- URL antiga: `https://5953e8e34f3c.ngrok-free.app`
- **Solução**: Configurada para usar o IP local da máquina: `http://172.30.0.2:3000`

## Correções Aplicadas

### 1. Backend (`/api/routes/rides.js`)
```javascript
// Movida a rota /pending para ANTES da rota /:id
router.get('/pending', async (req, res) => {
  // ... código da rota pending
});

router.get('/:id', async (req, res) => {
  // ... código da rota por ID
});
```

### 2. Configuração da API (`/config/api.js`)
```javascript
export const API_CONFIG = {
  // URLs atualizadas para o servidor local
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://172.30.0.2:3000/api',
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://172.30.0.2:3000',
  // ...
};
```

### 3. Servidor (`/api/server.js`)
```javascript
// Configurado para aceitar conexões de qualquer IP
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 API disponível em: http://172.30.0.2:${PORT}/api`);
});
```

## Como Funciona o Sistema de Notificações

### Fluxo Completo:
1. **Passageiro** cria uma solicitação de corrida
2. **API** salva a corrida com status "pending"
3. **Socket.IO** envia notificação para todos os motoristas online: `io.to('driver').emit('new_ride_request', {...})`
4. **Motoristas** conectados recebem a notificação via socket
5. **App do motorista** mostra a solicitação e permite aceitar/rejeitar

### Componentes Importantes:

#### Frontend (Motorista):
- `DriverMapScreen.js`: Conecta ao socket e escuta `new_ride_request`
- `DriverRequestsScreen.js`: Lista corridas pendentes via API `/rides/pending`
- `apiService.js`: Gerencia conexões socket e chamadas HTTP

#### Backend:
- `server.js`: Configura Socket.IO e gerencia conexões
- `routes/rides.js`: Endpoints para criar/aceitar/rejeitar corridas
- `routes/drivers.js`: Endpoints para registrar motoristas e status online

## Teste do Sistema

Para testar se está funcionando:

1. **Iniciar o servidor**: `cd api && node server.js`
2. **Registrar motorista**: 
   ```bash
   curl -X POST http://172.30.0.2:3000/api/drivers/register -H "Content-Type: application/json" -d '{...}'
   ```
3. **Colocar motorista online**:
   ```bash
   curl -X PUT http://172.30.0.2:3000/api/drivers/{id}/status -H "Content-Type: application/json" -d '{"isOnline": true, "location": {...}}'
   ```
4. **Criar corrida**:
   ```bash
   curl -X POST http://172.30.0.2:3000/api/rides/request -H "Content-Type: application/json" -d '{...}'
   ```
5. **Verificar corridas pendentes**:
   ```bash
   curl -s http://172.30.0.2:3000/api/rides/pending
   ```

## Próximos Passos

1. No app mobile, certifique-se de que o motorista:
   - Está logado e registrado na API (`apiDriverId` não é null)
   - Está com status online (`isOnline: true`)
   - Tem permissões de localização ativas
   - Está conectado ao socket

2. Para produção, considere:
   - Usar um banco de dados real em vez de armazenamento em memória
   - Implementar autenticação adequada
   - Configurar um domínio fixo em vez de IPs dinâmicos
   - Adicionar logs mais detalhados para debugging