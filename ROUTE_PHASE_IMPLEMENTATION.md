# Implementação da Funcionalidade de Rotas em Duas Fases

## Descrição da Funcionalidade

Implementada a funcionalidade solicitada onde:

1. **Quando motorista aceita a corrida**: O mapa do cliente mostra a rota do motorista até o cliente
2. **Quando motorista inicia a corrida** (chega no cliente): O mapa muda automaticamente para mostrar a rota do cliente até o destino

## Arquivos Modificados

### 1. `screens/HomeScreen.js`

#### Modificações principais:

- **Adicionado handler para evento `ride_started`**: Detecta quando o motorista inicia a corrida
- **Lógica de mudança de rota**: Automaticamente muda de "motorista→cliente" para "cliente→destino"
- **Fallback para dados da corrida**: Usa informações do destino dos dados da corrida se `selectedDestination` não estiver disponível
- **Botão de teste de desenvolvimento**: Para simular o evento `ride_started`

#### Principais funções implementadas:

```javascript
// Handler para evento ride_started (novos usuários)
apiService.onEvent('ride_started', (data) => {
  console.log('🚗 Corrida iniciada:', data);
  setRequestStatus('started');
  setDriverArrived(true);
  
  // Limpar marcador do motorista
  webViewRef.current.postMessage(JSON.stringify({
    action: 'clearDriverMarker'
  }));
  
  // Mostrar rota do cliente ao destino
  webViewRef.current.postMessage(JSON.stringify({
    action: 'setDestination',
    lat: selectedDestination.lat,
    lng: selectedDestination.lng,
    title: selectedDestination.name || selectedDestination.address
  }));
});

// Função de teste para desenvolvimento
const testRideStarted = () => {
  const testData = {
    rideId: 'test-ride-123',
    driverId: 'test-driver-456',
    ride: {
      destination: selectedDestination || {
        lat: -8.8284,
        lng: 13.2436,
        name: 'Destino de Teste',
        address: 'Local de teste - Centro de Luanda'
      }
    },
    status: 'started',
    timestamp: Date.now()
  };
  
  apiService.triggerCallbacks('ride_started', testData);
};
```

## Fluxo da Funcionalidade

### Fase 1: Motorista → Cliente
1. Cliente solicita corrida
2. Motorista aceita corrida (`ride_accepted`)
3. Mapa do cliente mostra:
   - Marcador do motorista
   - Rota do motorista até o cliente (linha verde)
   - Cliente pode acompanhar progresso em tempo real

### Fase 2: Cliente → Destino  
1. Motorista chega no cliente e clica "Passageiro Embarcou"
2. Backend envia evento `ride_started` via WebSocket
3. Cliente recebe evento e automaticamente:
   - Remove marcador do motorista
   - Limpa rota anterior
   - Mostra nova rota do cliente até o destino
   - Atualiza status para "Corrida Iniciada"

## Integração com Backend

### API Endpoint
- **PUT** `/api/rides/:id/start` - Motorista chama ao iniciar corrida

### WebSocket Event
- **`ride_started`** - Enviado para o cliente quando corrida é iniciada

### Payload esperado:
```json
{
  "rideId": "string",
  "driverId": "string", 
  "ride": {
    "destination": {
      "lat": number,
      "lng": number,
      "name": "string",
      "address": "string"
    }
  },
  "status": "started",
  "timestamp": number
}
```

## Testing

### Botão de Teste (Desenvolvimento)
- Aparece apenas quando `__DEV__ === true`
- Visível quando há motorista aceito mas corrida ainda não iniciada
- Simula o evento `ride_started` para testar a funcionalidade
- Localizado no canto inferior direito da tela

### Como testar:
1. Fazer uma solicitação de corrida
2. Aguardar motorista aceitar
3. Clicar no botão "Testar Iniciar" (laranja, canto direito)
4. Verificar se o mapa muda para mostrar rota ao destino

## Compatibilidade

- ✅ Funciona para novos usuários (registro via API)
- ✅ Funciona para usuários já registrados
- ✅ Mantém funcionalidade existente de proximidade do motorista
- ✅ Compatível com sistema WebSocket existente
- ✅ Fallback para dados da corrida se destino local não disponível

## Estados do Mapa

1. **Aguardando motorista**: Apenas localização do cliente
2. **Motorista aceito**: Cliente + Motorista + Rota (motorista→cliente)
3. **Corrida iniciada**: Cliente + Destino + Rota (cliente→destino)
4. **Corrida finalizada**: Limpa todas as rotas e marcadores

## Logs de Debug

O sistema inclui logs detalhados para debug:
- `🚗 Corrida iniciada:` - Quando evento é recebido
- `🎯 Corrida iniciada! Mudando para rota cliente->destino` - Mudança de fase
- `🗺️ Atualizando mapa para mostrar rota ao destino` - Atualização do mapa
- `🧪 TESTE: Simulando evento ride_started` - Teste manual

## Próximos Passos

1. **Testar com backend real** - Verificar se o backend envia o evento `ride_started` corretamente
2. **Refinar UX** - Adicionar animações de transição entre fases
3. **Notificações** - Melhorar feedback visual da mudança de fase
4. **Cleanup** - Remover botão de teste antes da produção