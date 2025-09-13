/**
 * Script de Debug para Problema de Notificação ride_accepted
 * 
 * Este script ajuda a identificar onde está o problema na comunicação
 * entre motorista e passageiro quando uma corrida é aceita.
 */

const io = require('socket.io-client');

// Configuração
const API_URL = 'https://three-api-9fac.onrender.com'; // Ajuste para sua URL
const TEST_PASSENGER_ID = 'test-passenger-' + Date.now();
const TEST_DRIVER_ID = 'test-driver-' + Date.now();

// Cores para console
const colors = {
  passenger: '\x1b[36m', // Cyan
  driver: '\x1b[33m',    // Yellow
  server: '\x1b[32m',    // Green
  error: '\x1b[31m',     // Red
  reset: '\x1b[0m'
};

// Log com cor
function log(type, message, data = null) {
  const color = colors[type] || colors.reset;
  const prefix = type.toUpperCase().padEnd(10);
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
  if (data) {
    console.log(`${color}[${prefix}]${colors.reset}`, JSON.stringify(data, null, 2));
  }
}

// Criar conexão do passageiro
function createPassengerConnection() {
  log('passenger', '🚶 Criando conexão do passageiro...');
  
  const passengerSocket = io(API_URL, {
    transports: ['websocket', 'polling']
  });

  passengerSocket.on('connect', () => {
    log('passenger', `✅ Passageiro conectado! Socket ID: ${passengerSocket.id}`);
    
    // Registrar como passageiro
    passengerSocket.emit('register', {
      userType: 'passenger',
      userId: TEST_PASSENGER_ID
    });
    
    log('passenger', `📝 Registrado com ID: ${TEST_PASSENGER_ID}`);
  });

  // Escutar TODOS os eventos possíveis
  passengerSocket.onAny((eventName, ...args) => {
    log('passenger', `📨 Evento recebido: ${eventName}`, args);
  });

  // Eventos específicos de corrida
  passengerSocket.on('ride_accepted', (data) => {
    log('passenger', '🎉 RIDE_ACCEPTED RECEBIDO!', data);
  });

  passengerSocket.on('no_drivers_available', (data) => {
    log('passenger', '🚫 Nenhum motorista disponível', data);
  });

  passengerSocket.on('registration_confirmed', (data) => {
    log('passenger', '✅ Registro confirmado pelo servidor', data);
  });

  passengerSocket.on('disconnect', (reason) => {
    log('passenger', `❌ Desconectado: ${reason}`);
  });

  passengerSocket.on('connect_error', (error) => {
    log('error', 'Erro de conexão (passageiro):', error.message);
  });

  return passengerSocket;
}

// Criar conexão do motorista
function createDriverConnection() {
  log('driver', '🚗 Criando conexão do motorista...');
  
  const driverSocket = io(API_URL, {
    transports: ['websocket', 'polling']
  });

  driverSocket.on('connect', () => {
    log('driver', `✅ Motorista conectado! Socket ID: ${driverSocket.id}`);
    
    // Registrar como motorista
    driverSocket.emit('register', {
      userType: 'driver',
      userId: TEST_DRIVER_ID
    });
    
    log('driver', `📝 Registrado com ID: ${TEST_DRIVER_ID}`);
  });

  // Escutar novas corridas
  driverSocket.on('new_ride_request', (data) => {
    log('driver', '🚖 Nova solicitação de corrida recebida!', data);
    
    if (data.ride) {
      // Auto-aceitar após 2 segundos
      setTimeout(() => {
        log('driver', '✋ Aceitando corrida...');
        acceptRide(data.ride.id);
      }, 2000);
    }
  });

  driverSocket.on('registration_confirmed', (data) => {
    log('driver', '✅ Registro confirmado pelo servidor', data);
  });

  driverSocket.on('disconnect', (reason) => {
    log('driver', `❌ Desconectado: ${reason}`);
  });

  return driverSocket;
}

// Criar corrida de teste
async function createTestRide() {
  log('server', '📝 Criando corrida de teste...');
  
  const rideData = {
    passengerId: TEST_PASSENGER_ID,
    passengerName: 'Teste Debug Passageiro',
    passengerPhone: '+244 900 000 000',
    pickup: {
      address: 'Origem Teste',
      lat: -8.8390,
      lng: 13.2894
    },
    destination: {
      address: 'Destino Teste',
      lat: -8.8500,
      lng: 13.3000
    },
    estimatedFare: 500,
    estimatedDistance: 5.2,
    estimatedTime: 15,
    paymentMethod: 'cash',
    vehicleType: 'standard'
  };

  try {
    const response = await fetch(`${API_URL}/api/rides/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rideData),
    });

    const result = await response.json();
    
    if (response.ok) {
      log('server', '✅ Corrida criada com sucesso!', result.data);
      return result.data.ride;
    } else {
      log('error', 'Erro ao criar corrida:', result);
      return null;
    }
  } catch (error) {
    log('error', 'Erro de rede ao criar corrida:', error.message);
    return null;
  }
}

// Aceitar corrida
async function acceptRide(rideId) {
  log('driver', `🤝 Aceitando corrida ${rideId}...`);
  
  const driverData = {
    driverId: TEST_DRIVER_ID,
    driverName: 'Motorista Teste Debug',
    driverPhone: '+244 923 456 789',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Branco',
      plate: 'LD-TEST-DB'
    }
  };

  try {
    const response = await fetch(`${API_URL}/api/rides/${rideId}/accept`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData),
    });

    const result = await response.json();
    
    if (response.ok) {
      log('driver', '✅ Corrida aceita com sucesso!', result);
    } else {
      log('error', 'Erro ao aceitar corrida:', result);
    }
  } catch (error) {
    log('error', 'Erro de rede ao aceitar corrida:', error.message);
  }
}

// Executar teste completo
async function runDebugTest() {
  console.log('🧪 INICIANDO TESTE DE DEBUG PARA RIDE_ACCEPTED\n');
  console.log('IDs de teste:');
  console.log(`  Passageiro: ${TEST_PASSENGER_ID}`);
  console.log(`  Motorista: ${TEST_DRIVER_ID}`);
  console.log('\n' + '='.repeat(50) + '\n');

  // 1. Conectar passageiro
  const passengerSocket = createPassengerConnection();
  
  // 2. Aguardar conexão estabilizar
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. Conectar motorista
  const driverSocket = createDriverConnection();
  
  // 4. Aguardar ambos estarem conectados
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 5. Criar corrida
  const ride = await createTestRide();
  
  if (!ride) {
    log('error', '❌ Falha ao criar corrida. Abortando teste.');
    process.exit(1);
  }
  
  // 6. Aguardar por eventos (30 segundos)
  log('server', '⏳ Aguardando eventos por 30 segundos...');
  
  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO TESTE:\n');
    
    console.log('Verifique nos logs acima:');
    console.log('1. ✅ Passageiro e motorista conectaram?');
    console.log('2. ✅ Motorista recebeu new_ride_request?');
    console.log('3. ✅ Motorista aceitou a corrida?');
    console.log('4. ❓ Passageiro recebeu ride_accepted?');
    console.log('\nSe o passageiro NÃO recebeu ride_accepted, verifique:');
    console.log('- Os IDs estão sendo comparados corretamente no servidor?');
    console.log('- O evento está sendo emitido para o socket correto?');
    console.log('- Há algum erro de normalização de IDs?');
    
    console.log('\n' + '='.repeat(50));
    
    // Desconectar
    passengerSocket.disconnect();
    driverSocket.disconnect();
    
    setTimeout(() => process.exit(0), 1000);
  }, 30000);
}

// Executar
if (require.main === module) {
  runDebugTest().catch(console.error);
}

module.exports = { runDebugTest };