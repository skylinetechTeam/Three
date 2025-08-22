# WebSocket Testing - Monitoramento de Status de Solicitações

## Funcionalidades Implementadas

### 1. Estados de Solicitação
- **pending**: Solicitação criada, aguardando resposta dos motoristas
- **accepted**: Solicitação aceita por um motorista
- **rejected**: Solicitação rejeitada ou nenhum motorista disponível
- **started**: Corrida iniciada
- **completed**: Corrida finalizada
- **cancelled**: Corrida cancelada

### 2. Eventos WebSocket Implementados

#### ride_accepted
```javascript
{
  rideId: 'ride_123',
  driver: {
    id: 'driver_456',
    name: 'João Motorista',
    phone: '+244 923 456 789',
    rating: 4.8,
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      plate: 'LD-123-AB'
    },
    location: { lat: -8.8390, lng: 13.2894 }
  },
  estimatedArrival: '5-7 minutos'
}
```

#### ride_rejected
```javascript
{
  rideId: 'ride_123',
  reason: 'Motorista não disponível no momento'
}
```

#### no_drivers_available
```javascript
{
  rideId: 'ride_123',
  message: 'Nenhum motorista disponível na região'
}
```

#### driver_location_update
```javascript
{
  driverId: 'driver_456',
  location: { lat: -8.8400, lng: 13.2900 },
  estimatedArrival: '3-5 minutos'
}
```

### 3. Interface do Usuário

#### Indicador de Status (Barra Superior)
- **Laranja**: "Procurando motorista..." (status: pending)
- **Verde**: "João está a caminho - 5-7 minutos" (status: accepted)

#### Card de Solicitação Aceita
- Informações do motorista (nome, avaliação)
- Detalhes do veículo
- Tempo estimado de chegada
- Botões de ação (Ligar, Cancelar)

#### Notificações Toast
- Solicitação aceita: Toast verde com detalhes do motorista
- Solicitação rejeitada: Toast vermelho com motivo
- Status updates: Toasts informativos

### 4. Como Testar

#### Teste Básico
1. Abra o app e faça uma solicitação de corrida
2. Observe o indicador de status na barra superior
3. Aguarde os eventos WebSocket do servidor

#### Teste com Simulação (Desenvolvimento)
```javascript
// No console do navegador ou debug do React Native:

// Simular aceitação de corrida
window.simulateRideAcceptance();

// Simular rejeição de corrida
window.simulateRideRejection();
```

#### Teste de Integração Completo

**1. Iniciar o Servidor**
```bash
cd api
npm install
npm start
```

**2. Iniciar o Simulador de Motorista**
```bash
cd api
node test-driver-simulator.js
```

**3. Testar Fluxo Completo**
1. Abra o app React Native
2. Faça uma solicitação de corrida
3. O simulador de motorista receberá a solicitação via WebSocket
4. O motorista aceitará ou rejeitará automaticamente
5. O app receberá o sinal WebSocket e atualizará a UI
6. Se aceito, o fluxo continua: start → complete

#### Endpoints da API que Emitem WebSocket

**POST /api/rides/request**
- Emite: `new_ride_request` para motoristas
- Configura timeout de 30s para `no_drivers_available`

**PUT /api/rides/:id/accept**
- Emite: `ride_accepted` para o passageiro específico

**PUT /api/rides/:id/reject**
- Emite: `ride_rejected` para o passageiro específico

**PUT /api/rides/:id/start**
- Emite: `ride_started` para o passageiro específico

**PUT /api/rides/:id/complete**
- Emite: `ride_completed` para o passageiro específico

**PUT /api/rides/:id/cancel**
- Emite: `ride_cancelled` para o usuário relevante

### 5. Logs de Debug

O app registra logs detalhados para debugging:

```javascript
console.log('🎉 Corrida aceita pelo motorista:', data);
console.log('❌ Solicitação rejeitada pelo motorista:', data);
console.log('📍 Atualização de localização do motorista:', data);
console.log('🧪 Simulando aceitação de corrida...');
```

### 6. Configuração do WebSocket

O WebSocket é configurado automaticamente quando:
1. O usuário se registra como passageiro
2. A conexão é estabelecida com o servidor
3. O usuário é registrado no socket com tipo 'passenger'

### 7. Tratamento de Erros

- Reconexão automática em caso de perda de conexão
- Fallback para polling se WebSocket falhar
- Timeout de 30 segundos para busca de motoristas
- Limpeza automática de estados ao cancelar

### 8. Próximos Passos

1. **Rastreamento em Tempo Real**: Mostrar localização do motorista no mapa
2. **Notificações Push**: Alertas mesmo com app em background
3. **Chat com Motorista**: Comunicação direta via WebSocket
4. **Histórico de Solicitações**: Armazenar status de todas as solicitações
5. **Métricas**: Tempo médio de resposta, taxa de aceitação

### 9. Troubleshooting

#### WebSocket não conecta
- Verifique a URL do servidor em `config/api.js`
- Confirme se o servidor Socket.IO está rodando
- Verifique logs de conexão no console

#### Eventos não são recebidos
- Confirme se o usuário está registrado no socket
- Verifique se o servidor está emitindo eventos corretos
- Confirme se os listeners estão configurados

#### UI não atualiza
- Verifique se os estados React estão sendo atualizados
- Confirme se os componentes estão renderizando condicionalmente
- Verifique logs de estado no console