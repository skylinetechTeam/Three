# 🚖 Taxi API

API completa para gerenciamento de solicitações de corrida de taxi com atualizações em tempo real.

## 🚀 Instalação e Execução

```bash
# Instalar dependências
cd api
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 📡 Endpoints da API

### 🚗 Corridas (`/api/rides`)

#### Criar Nova Solicitação
```http
POST /api/rides/request
Content-Type: application/json

{
  "passengerId": "passenger_123",
  "passengerName": "João Silva",
  "passengerPhone": "+244 912 345 678",
  "pickup": {
    "address": "Rua da Liberdade, 123, Luanda",
    "lat": -8.8390,
    "lng": 13.2894
  },
  "destination": {
    "address": "Shopping Belas, Talatona",
    "lat": -8.9876,
    "lng": 13.1234
  },
  "estimatedFare": 750,
  "estimatedDistance": 12.5,
  "estimatedTime": 25,
  "paymentMethod": "cash",
  "vehicleType": "standard",
  "notes": "Aguardando na entrada principal"
}
```

#### Aceitar Corrida (Motorista)
```http
PUT /api/rides/{rideId}/accept
Content-Type: application/json

{
  "driverId": "driver_456",
  "driverName": "Carlos Motorista",
  "driverPhone": "+244 923 456 789",
  "vehicleInfo": {
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "color": "Branco",
    "plate": "LD-123-AB"
  }
}
```

#### Outros Endpoints de Corrida
- `GET /api/rides` - Listar corridas
- `GET /api/rides/{id}` - Detalhes da corrida
- `PUT /api/rides/{id}/reject` - Rejeitar corrida
- `PUT /api/rides/{id}/start` - Iniciar corrida
- `PUT /api/rides/{id}/complete` - Finalizar corrida
- `PUT /api/rides/{id}/cancel` - Cancelar corrida
- `PUT /api/rides/{id}/location` - Atualizar localização
- `GET /api/rides/pending` - Corridas pendentes

### 👨‍✈️ Motoristas (`/api/drivers`)

#### Registrar Motorista
```http
POST /api/drivers/register
Content-Type: application/json

{
  "name": "Carlos Silva",
  "phone": "+244 923 456 789",
  "email": "carlos@email.com",
  "licenseNumber": "AB123456789",
  "vehicleInfo": {
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "color": "Branco",
    "plate": "LD-123-AB"
  },
  "location": {
    "lat": -8.8390,
    "lng": 13.2894
  }
}
```

#### Outros Endpoints de Motoristas
- `PUT /api/drivers/{id}/status` - Atualizar status online/offline
- `GET /api/drivers/nearby` - Motoristas próximos
- `GET /api/drivers/{id}` - Perfil do motorista
- `PUT /api/drivers/{id}/location` - Atualizar localização

### 👥 Passageiros (`/api/passengers`)

#### Registrar Passageiro
```http
POST /api/passengers/register
Content-Type: application/json

{
  "name": "Maria Santos",
  "phone": "+244 912 345 678",
  "email": "maria@email.com",
  "preferredPaymentMethod": "card"
}
```

#### Outros Endpoints de Passageiros
- `GET /api/passengers/{id}` - Perfil do passageiro
- `GET /api/passengers/{id}/rides` - Histórico de corridas
- `PUT /api/passengers/{id}/favorites` - Adicionar local favorito
- `DELETE /api/passengers/{id}/favorites/{favoriteId}` - Remover favorito

## 🔄 WebSocket Events (Socket.IO)

### Para Motoristas
- `new_ride_request` - Nova solicitação disponível
- `ride_unavailable` - Corrida já aceita por outro motorista
- `ride_cancelled` - Corrida cancelada pelo passageiro

### Para Passageiros
- `ride_accepted` - Corrida aceita por motorista
- `ride_started` - Corrida iniciada
- `ride_completed` - Corrida finalizada
- `driver_location_update` - Atualização da localização do motorista

### Conectar ao WebSocket
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// Registrar como motorista
socket.emit('register', {
  userType: 'driver',
  userId: 'driver_123'
});

// Escutar novas solicitações
socket.on('new_ride_request', (data) => {
  console.log('Nova corrida:', data.ride);
});
```

## 📊 Exemplos de Uso

### 1. Fluxo Completo de Corrida

```javascript
// 1. Passageiro solicita corrida
const response = await fetch('http://localhost:3000/api/rides/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    passengerId: 'pass_123',
    passengerName: 'João Silva',
    pickup: {
      address: 'Rua A, 123',
      lat: -8.8390,
      lng: 13.2894
    },
    destination: {
      address: 'Rua B, 456', 
      lat: -8.8500,
      lng: 13.3000
    },
    estimatedFare: 500,
    estimatedDistance: 5.2,
    estimatedTime: 15,
    paymentMethod: 'cash'
  })
});

// 2. Motorista aceita corrida
await fetch(`http://localhost:3000/api/rides/${rideId}/accept`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driverId: 'driver_456',
    driverName: 'Carlos Motorista',
    driverPhone: '+244 923 456 789'
  })
});

// 3. Motorista inicia corrida
await fetch(`http://localhost:3000/api/rides/${rideId}/start`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driverId: 'driver_456',
    pickupLocation: { lat: -8.8390, lng: 13.2894 }
  })
});

// 4. Motorista finaliza corrida
await fetch(`http://localhost:3000/api/rides/${rideId}/complete`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driverId: 'driver_456',
    dropoffLocation: { lat: -8.8500, lng: 13.3000 },
    actualFare: 520,
    paymentConfirmed: true
  })
});
```

### 2. Buscar Motoristas Próximos

```javascript
const response = await fetch(
  'http://localhost:3000/api/drivers/nearby?lat=-8.8390&lng=13.2894&radius=5'
);
const data = await response.json();
console.log('Motoristas próximos:', data.data);
```

### 3. Monitorar Corridas em Tempo Real

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:3000');

// Registrar como passageiro
socket.emit('register', {
  userType: 'passenger',
  userId: 'pass_123'
});

// Escutar atualizações da corrida
socket.on('ride_accepted', (data) => {
  console.log('Motorista encontrado:', data.driver);
});

socket.on('driver_location_update', (data) => {
  console.log('Localização do motorista:', data.driverLocation);
});
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
PORT=3000
NODE_ENV=development
```

### Estrutura do Projeto
```
api/
├── server.js              # Servidor principal
├── package.json           # Dependências
├── routes/
│   ├── rides.js           # Rotas de corridas
│   ├── drivers.js         # Rotas de motoristas
│   └── passengers.js      # Rotas de passageiros
├── services/
│   └── rideService.js     # Lógica de negócio
├── middleware/
│   ├── errorHandler.js    # Tratamento de erros
│   └── validation.js      # Validação de dados
└── README.md              # Documentação
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testar endpoint de health
curl http://localhost:3000/health

# Testar criação de corrida
curl -X POST http://localhost:3000/api/rides/request \
  -H "Content-Type: application/json" \
  -d '{"passengerId":"test","passengerName":"Teste","pickup":{"address":"Origem","lat":-8.8390,"lng":13.2894},"destination":{"address":"Destino","lat":-8.8500,"lng":13.3000},"estimatedFare":500,"estimatedDistance":5,"estimatedTime":15}'
```

## 📈 Recursos

- ✅ **Validação completa** de dados com Joi
- ✅ **Atualizações em tempo real** com Socket.IO
- ✅ **Rate limiting** para prevenir spam
- ✅ **CORS configurado** para React Native
- ✅ **Logs detalhados** para debugging
- ✅ **Cálculo de distâncias** com fórmula de Haversine
- ✅ **Gestão de estados** das corridas
- ✅ **Busca por proximidade** de motoristas
- ✅ **Sistema de favoritos** para passageiros
- ✅ **Estatísticas** de corridas
- ✅ **Tratamento de erros** robusto

## 🌐 Status Codes

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `404` - Não encontrado
- `409` - Conflito (já existe)
- `429` - Muitas requisições
- `500` - Erro interno do servidor