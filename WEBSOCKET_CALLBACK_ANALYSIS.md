# Análise do Problema de Callbacks WebSocket

## Resumo Executivo

A API está estruturada corretamente para o fluxo de aceitação de corridas, mas os callbacks WebSocket não estão chegando ao cliente passageiro quando o motorista aceita uma corrida. Esta análise identifica os pontos de falha potenciais e propõe soluções.

## Problemas Identificados

### 1. **Problema de Timing no Registro de Callbacks**

**Localização**: `screens/HomeScreen.js` (linhas 319-642)

O cliente está registrando os callbacks ANTES de conectar o socket, mas há uma condição de corrida:

```javascript
// Callbacks são registrados
apiService.onEvent('ride_accepted', (data) => { ... });

// Socket é conectado DEPOIS
apiService.connectSocket('passenger', passengerId);
```

**Problema**: Em `apiService.js` (linha 163-176), os callbacks só são adicionados ao socket SE ele já estiver conectado. Como o socket ainda não foi conectado quando os callbacks são registrados, eles ficam apenas na memória local e não são vinculados ao socket real.

### 2. **Normalização de IDs Inconsistente**

**Localização**: `api/routes/rides.js` (linhas 331-337)

O servidor normaliza IDs como strings, mas isso pode não estar acontecendo consistentemente em todo o fluxo:

```javascript
// Servidor normaliza
const connectionUserId = String(connection.userId);
const ridePassengerId = String(ride.passengerId);

// Mas o cliente pode enviar números
passengerId: passengerProfile.apiPassengerId // Pode ser número
```

### 3. **Problema na Função `setupRideEventListeners`**

**Localização**: `services/apiService.js` (linha 200)

A função `setupRideEventListeners` está definida mas o código está incompleto no arquivo. Esta função deveria configurar todos os listeners quando o socket conecta, mas parece não estar sendo chamada corretamente.

### 4. **Falta de Verificação de Socket Ativo**

**Localização**: `api/routes/rides.js` (linhas 342-358)

O servidor verifica se o socket existe mas pode não estar verificando se ainda está realmente conectado:

```javascript
const socketInstance = io.sockets.sockets.get(socketId);
if (socketInstance && socketInstance.connected) {
    // Envia notificação
}
```

Esta verificação acontece DEPOIS de já ter tentado encontrar o passageiro, o que pode resultar em tentativas de envio para sockets desconectados.

### 5. **Passageiros Já Registrados Sem Callbacks**

**Localização**: `screens/HomeScreen.js` (linhas 647-678)

Para passageiros já registrados, o código apenas verifica se callbacks existem mas não os registra novamente se estiverem faltando.

## Soluções Recomendadas

### 1. **Implementar Registro de Callbacks Após Conexão**

Modificar `apiService.js` para garantir que callbacks sejam registrados após a conexão:

```javascript
// Em connectSocket, após 'connect' event:
this.socket.on('connect', () => {
    // ... código existente ...
    
    // Registrar callbacks pendentes
    this.registerPendingCallbacks();
});

// Nova função
registerPendingCallbacks() {
    for (const [eventName, callbacks] of this.eventCallbacks.entries()) {
        callbacks.forEach(callback => {
            if (!this.socket.hasListeners(eventName)) {
                this.socket.on(eventName, callback);
            }
        });
    }
}
```

### 2. **Implementar Sistema de Heartbeat**

Adicionar verificação periódica de conectividade:

```javascript
// Cliente envia ping periodicamente
setInterval(() => {
    if (this.socket && this.socket.connected) {
        this.socket.emit('ping', {
            userType: this.userType,
            userId: this.userId,
            timestamp: Date.now()
        });
    }
}, 5000);

// Servidor responde e valida conexão
socket.on('ping', (data) => {
    // Atualizar registro de conexão ativa
    activeConnections.set(socket.id, {
        ...activeConnections.get(socket.id),
        lastPing: new Date().toISOString()
    });
    
    socket.emit('pong', { timestamp: data.timestamp });
});
```

### 3. **Garantir Normalização Consistente de IDs**

Criar função utilitária para normalização:

```javascript
// utils/idNormalizer.js
export const normalizeId = (id) => {
    if (id === null || id === undefined) return null;
    return String(id).trim();
};

// Usar em todos os lugares
const normalizedUserId = normalizeId(userId);
const normalizedPassengerId = normalizeId(passengerId);
```

### 4. **Implementar Retry Logic para Notificações Críticas**

Para eventos importantes como `ride_accepted`, implementar tentativas múltiplas:

```javascript
// No servidor
const notifyWithRetry = async (socketId, event, data, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        const socket = io.sockets.sockets.get(socketId);
        
        if (socket && socket.connected) {
            socket.emit(event, data);
            
            // Aguardar confirmação
            const confirmed = await new Promise((resolve) => {
                socket.once(`${event}_ack`, () => resolve(true));
                setTimeout(() => resolve(false), 1000);
            });
            
            if (confirmed) return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return false;
};
```

### 5. **Adicionar Logging Detalhado**

Implementar logging estruturado para rastrear o fluxo completo:

```javascript
// Cliente
console.log('[WEBSOCKET] Event flow:', {
    timestamp: new Date().toISOString(),
    event: 'callback_registration',
    socketConnected: this.socket?.connected,
    eventName: eventName,
    callbackCount: this.eventCallbacks.get(eventName)?.length
});

// Servidor
console.log('[WEBSOCKET] Notification flow:', {
    timestamp: new Date().toISOString(),
    event: 'ride_accepted_notification',
    targetUser: ride.passengerId,
    socketFound: !!socketInstance,
    socketConnected: socketInstance?.connected,
    notificationMethod: passengerNotified ? 'direct' : 'broadcast'
});
```

### 6. **Implementar Fallback via Polling**

Como backup, implementar polling para status de corrida:

```javascript
// Cliente verifica periodicamente o status da corrida
const pollRideStatus = async (rideId) => {
    const interval = setInterval(async () => {
        try {
            const response = await apiService.getRideStatus(rideId);
            
            if (response.data.status === 'accepted' && !driverInfo) {
                // Atualizar UI manualmente se WebSocket falhou
                handleRideAccepted(response.data);
                clearInterval(interval);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 2000);
    
    // Parar após 60 segundos
    setTimeout(() => clearInterval(interval), 60000);
};
```

## Teste de Validação

Use o `test-callback-system.js` existente para validar as correções:

```bash
# No console do navegador
await callbackTester.initialize('passenger', 'test-123');
await callbackTester.runFullTest();
```

## Conclusão

O problema principal está na ordem de registro dos callbacks e na falta de garantia de que eles sejam vinculados ao socket após a conexão. Implementando as soluções propostas, especialmente a solução 1 (registro após conexão) e a solução 4 (retry logic), o sistema deve funcionar corretamente.

## Próximos Passos

1. Implementar a função `registerPendingCallbacks` em `apiService.js`
2. Adicionar normalização consistente de IDs
3. Implementar sistema de heartbeat
4. Adicionar logging detalhado para debugging
5. Testar com `callbackTester` após cada mudança
6. Considerar implementar polling como fallback para casos extremos