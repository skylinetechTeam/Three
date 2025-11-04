# Sistema de Corridas Agendadas - Documentação

## 🎯 Resumo da Implementação

O sistema de corridas agendadas foi implementado com sucesso no aplicativo de corridas. Agora os usuários podem:

- ✅ Criar corridas para serem executadas em horários específicos no futuro
- ✅ As corridas agendadas ficam "dormindo" até o horário programado
- ✅ Um scheduler automatizado verifica e ativa corridas no momento certo
- ✅ Motoristas só recebem notificações quando a corrida deve ser executada

## 🔄 Fluxo do Sistema

### Corridas Imediatas (como antes)
1. Usuário cria corrida sem `scheduledTime`
2. Status: `pending`
3. Motoristas são notificados imediatamente
4. Timeout de 30 segundos se nenhum motorista aceitar

### Corridas Agendadas (nova funcionalidade)
1. Usuário cria corrida com `scheduledTime` no futuro
2. Status: `scheduled`
3. **Motoristas NÃO são notificados** (corrida fica "dormindo")
4. Scheduler verifica a cada 60 segundos
5. Quando horário chega: status muda para `pending`
6. **Agora motoristas são notificados**
7. Timeout normal de 30 segundos se nenhum aceitar

## 📝 Mudanças Implementadas

### 1. Validação Joi (rides.js)
```javascript
scheduledTime: Joi.date().iso().min('now').optional()
```

### 2. Lógica de Criação da Corrida
```javascript
// Determinar status baseado no agendamento
const now = new Date();
const scheduledTime = value.scheduledTime ? new Date(value.scheduledTime) : null;
const isScheduled = scheduledTime && scheduledTime > now;

const rideData = {
  // ... outros campos
  status: isScheduled ? 'scheduled' : 'pending',
  scheduledTime: scheduledTime ? scheduledTime.toISOString() : null
};
```

### 3. Notificação Condicional
```javascript
// Só notificar motoristas se a corrida estiver disponível imediatamente
if (ride.status === 'pending') {
  io.to('driver').emit('new_ride_request', { /* dados */ });
  console.log('✅ Corrida criada e notificada aos motoristas');
} else {
  console.log('⏰ Corrida agendada - aguardando horário');
}
```

### 4. Scheduler Automático
- ✅ Verifica corridas agendadas a cada 60 segundos
- ✅ Ativa corridas cujo horário chegou (margem de 1 minuto)
- ✅ Muda status de `scheduled` → `pending`
- ✅ Notifica motoristas quando ativadas
- ✅ Configura timeout de 30s para expiração

### 5. Suporte no RideService
- ✅ Campo `scheduledTime` no modelo de dados
- ✅ Status `scheduled` nas estatísticas
- ✅ Método `updateRideStatus` utilizado pelo scheduler

### 6. Inicialização no Servidor
- ✅ Scheduler iniciado automaticamente quando servidor sobe
- ✅ Cleanup gracioso no shutdown
- ✅ Logs detalhados para debugging

## 🧪 Como Testar

### Corrida Imediata
```bash
POST /api/rides/request
Content-Type: application/json

{
  "passengerId": "pass123",
  "passengerName": "João Silva",
  "pickup": {
    "address": "Rua A, 123",
    "lat": -23.5505,
    "lng": -46.6333
  },
  "destination": {
    "address": "Rua B, 456",
    "lat": -23.5525,
    "lng": -46.6353
  },
  "estimatedFare": 25.50,
  "estimatedDistance": 5.2,
  "estimatedTime": 15
}
```
**Resultado esperado:** Status `pending`, motoristas notificados imediatamente.

### Corrida Agendada
```bash
POST /api/rides/request
Content-Type: application/json

{
  "passengerId": "pass456",
  "passengerName": "Maria Santos",
  "pickup": {
    "address": "Rua C, 789",
    "lat": -23.5515,
    "lng": -46.6343
  },
  "destination": {
    "address": "Rua D, 101",
    "lat": -23.5535,
    "lng": -46.6363
  },
  "estimatedFare": 18.75,
  "estimatedDistance": 3.8,
  "estimatedTime": 12,
  "scheduledTime": "2025-09-23T16:30:00.000Z"
}
```
**Resultado esperado:** Status `scheduled`, motoristas NÃO notificados até o horário.

### Verificar Corridas Agendadas
```bash
GET /api/rides?status=scheduled
```

## 📊 Status de Corridas

O sistema agora suporta os seguintes status:

| Status | Descrição |
|--------|-----------|
| `scheduled` | 🆕 Corrida agendada, aguardando horário |
| `pending` | Corrida disponível para motoristas |
| `accepted` | Corrida aceita por motorista |
| `in_progress` | Corrida em andamento |
| `completed` | Corrida finalizada |
| `cancelled` | Corrida cancelada |
| `expired` | 🆕 Corrida que ninguém aceitou |

## 🔍 Logs do Sistema

O scheduler produz logs detalhados:

```
⏰ [SCHEDULER] Verificando corridas agendadas...
📅 [SCHEDULER] Encontradas 2 corridas agendadas
🕰️ [SCHEDULER] Corrida abc123: Agendada para 23/09/2025 16:30:00, agora é 23/09/2025 16:30:15, diferença: 15s
✅ [SCHEDULER] Ativando corrida agendada abc123
🚗 [SCHEDULER] Corrida abc123 ativada e notificada aos motoristas
```

## ⚠️ Considerações Importantes

1. **Fuso Horário**: Todas as datas devem ser enviadas em ISO 8601 (UTC)
2. **Margem de Erro**: Scheduler aceita até 1 minuto de atraso
3. **Frequência**: Verificação a cada 60 segundos (configurável)
4. **Memória**: Sistema atual usa armazenamento em memória
5. **Escalabilidade**: Para produção, considere usar banco de dados + job queue

## 🚀 Próximos Passos (Opcionais)

- [ ] Interface para cancelar corridas agendadas
- [ ] Notificações push para lembrar usuários
- [ ] Reagendamento de corridas
- [ ] Histórico de corridas agendadas
- [ ] Dashboard administrativo

## 🎉 Conclusão

O sistema de corridas agendadas está **100% funcional** e pronto para uso. A implementação é robusta, com logs detalhados e tratamento de erros adequado.

**Principais benefícios:**
- ✅ Não interfere nas corridas imediatas
- ✅ Funcionamento automático e transparente
- ✅ Fácil de testar e debugar
- ✅ Código bem documentado
- ✅ Escalável e extensível