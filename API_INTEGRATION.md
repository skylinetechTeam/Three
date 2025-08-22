# API Integration Documentation

## Visão Geral

Este projeto agora está totalmente integrado com a API Node.js para gerenciamento de corridas de táxi. Tanto a parte do motorista quanto a parte do cliente agora usam endpoints da API em vez de apenas dados locais.

## Arquitetura

```
[React Native App] ←→ [API Service] ←→ [Node.js API] ←→ [Socket.IO]
```

### Componentes Principais

1. **API Service** (`/services/apiService.js`) - Camada de comunicação com a API
2. **Local Database** (`/services/localDatabase.js`) - Cache local e fallback
3. **API Server** (`/api/server.js`) - Servidor Node.js com Socket.IO
4. **Configuration** (`/config/api.js`) - Configurações da API

## Funcionalidades Implementadas

### 🚗 Parte do Motorista

#### Registro e Login
- **DriverLoginScreen**: Registra motorista na API durante o primeiro login
- Armazena `apiDriverId` localmente para uso posterior
- Conecta automaticamente ao Socket.IO após login

#### Gerenciamento de Corridas
- **DriverMapScreen**: 
  - Recebe solicitações em tempo real via Socket.IO
  - Aceita/rejeita corridas via API
  - Inicia e finaliza corridas com sincronização da API
  - Atualiza localização em tempo real

- **DriverRequestsScreen**:
  - Lista corridas pendentes da API
  - Aceita/rejeita corridas com notificação em tempo real

#### Status Online/Offline
- Atualiza status na API quando motorista fica online/offline
- Sincroniza localização automaticamente quando online

### 👤 Parte do Cliente/Passageiro

#### Registro e Login
- **RegisterScreen + SetPasswordScreen**: Registra passageiro na API
- **LoginScreen**: Conecta ao Socket.IO após login
- Armazena `apiPassengerId` localmente

#### Solicitação de Corridas
- **HomeScreen**: 
  - Cria solicitações de corrida via API
  - Recebe notificações em tempo real sobre status da corrida
  - Calcula preço usando algoritmo da API

## Endpoints da API Utilizados

### Motoristas
- `POST /api/drivers/register` - Registro de motorista
- `PUT /api/drivers/:id/status` - Atualizar status online/offline
- `PUT /api/drivers/:id/location` - Atualizar localização
- `GET /api/drivers/nearby` - Buscar motoristas próximos

### Passageiros
- `POST /api/passengers/register` - Registro de passageiro
- `GET /api/passengers/:id` - Perfil do passageiro
- `GET /api/passengers/:id/rides` - Histórico de corridas

### Corridas
- `POST /api/rides/request` - Criar solicitação de corrida
- `GET /api/rides/pending` - Listar corridas pendentes
- `PUT /api/rides/:id/accept` - Aceitar corrida
- `PUT /api/rides/:id/reject` - Rejeitar corrida
- `PUT /api/rides/:id/start` - Iniciar corrida
- `PUT /api/rides/:id/complete` - Finalizar corrida
- `PUT /api/rides/:id/cancel` - Cancelar corrida
- `PUT /api/rides/:id/location` - Atualizar localização durante corrida

## Socket.IO Events

### Para Motoristas
- `new_ride_request` - Nova solicitação de corrida disponível
- `ride_unavailable` - Corrida não está mais disponível

### Para Passageiros
- `ride_accepted` - Corrida foi aceita por um motorista
- `ride_started` - Corrida foi iniciada
- `ride_completed` - Corrida foi finalizada
- `driver_location_update` - Atualização da localização do motorista

## Configuração

### Variáveis de Ambiente
```bash
# Para React Native (.env)
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# Para produção
EXPO_PUBLIC_API_URL=https://sua-api.com/api
EXPO_PUBLIC_SOCKET_URL=https://sua-api.com
```

### Configuração da API (`/config/api.js`)
- URLs base configuráveis
- Timeouts e retry logic
- Configurações de localização
- Flags de desenvolvimento

## Fallback e Resiliência

O sistema foi projetado para ser resiliente:

1. **Fallback Local**: Se a API falhar, o app continua funcionando com dados locais
2. **Retry Logic**: Tentativas automáticas em caso de falha de rede
3. **Graceful Degradation**: Funcionalidades continuam disponíveis mesmo sem conexão

## Como Testar

### 1. Iniciar a API
```bash
cd api
npm install
npm start
```

### 2. Testar Endpoints
```bash
node test-integration.js
```

### 3. Testar no App
1. Faça login como motorista (use `912345678`)
2. Ative o status online
3. Em outro dispositivo/simulador, solicite uma corrida
4. Observe as notificações em tempo real

## Logs e Debug

- API calls são logados no console
- Socket.IO connections são monitoradas
- Erros são capturados e exibidos via Toast

## Próximos Passos

1. **Banco de Dados Persistente**: Substituir storage em memória por PostgreSQL/MongoDB
2. **Autenticação JWT**: Implementar autenticação robusta
3. **Push Notifications**: Adicionar notificações push
4. **Métricas**: Implementar tracking de performance
5. **Testes Automatizados**: Adicionar testes unitários e de integração

## Estrutura de Dados

### Driver
```javascript
{
  id: "uuid",
  name: "João Silva",
  phone: "+244912345678",
  email: "joao@email.com",
  licenseNumber: "CNH123456789",
  vehicleInfo: {
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    color: "Branco",
    plate: "LD-12-34-AB"
  },
  isOnline: true,
  status: "available", // available, busy, offline
  location: { lat: -8.8390, lng: 13.2894 }
}
```

### Passenger
```javascript
{
  id: "uuid",
  name: "Maria Santos",
  phone: "+244923456789",
  email: "maria@email.com",
  preferredPaymentMethod: "cash"
}
```

### Ride
```javascript
{
  id: "uuid",
  passengerId: "passenger-uuid",
  passengerName: "Maria Santos",
  pickup: {
    address: "Rua A, 123",
    lat: -8.8390,
    lng: 13.2894
  },
  destination: {
    address: "Rua B, 456",
    lat: -8.8500,
    lng: 13.3000
  },
  estimatedFare: 500,
  estimatedDistance: 5.2,
  estimatedTime: 15,
  status: "pending", // pending, accepted, in_progress, completed, cancelled
  driverId: "driver-uuid", // quando aceita
  driverName: "João Silva",
  vehicleInfo: { ... }
}
```