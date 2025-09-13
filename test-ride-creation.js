/**
 * Script de teste para verificar criação de corridas
 * Execute este arquivo para diagnosticar problemas na criação de corridas
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Função para testar a API
async function testApiHealth() {
  console.log('🔍 Testando saúde da API...');
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log('✅ API está funcionando:', data);
    return true;
  } catch (error) {
    console.error('❌ API não está respondendo:', error.message);
    return false;
  }
}

// Função para criar uma corrida de teste
async function testCreateRide() {
  console.log('\n📝 Criando corrida de teste...');
  
  const testRideData = {
    passengerId: 'test-passenger-123',
    passengerName: 'Teste Passageiro',
    passengerPhone: '+244 900 000 000',
    pickup: {
      address: 'Rua Teste, 123',
      lat: -8.8390,
      lng: 13.2894
    },
    destination: {
      address: 'Rua Destino, 456',
      lat: -8.8500,
      lng: 13.3000
    },
    estimatedFare: 500,
    estimatedDistance: 5.2,
    estimatedTime: 15,
    paymentMethod: 'cash',
    vehicleType: 'standard'
  };

  console.log('📦 Dados da corrida:', JSON.stringify(testRideData, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/rides/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRideData),
    });

    console.log('📡 Status da resposta:', response.status, response.statusText);

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro na resposta:', data);
      return null;
    }

    console.log('✅ Corrida criada com sucesso:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar corrida:', error);
    return null;
  }
}

// Função para verificar se há motoristas conectados
async function checkConnectedDrivers() {
  console.log('\n👨‍✈️ Verificando motoristas conectados...');
  
  // Conectar ao WebSocket para verificar
  const io = require('socket.io-client');
  const socket = io('http://localhost:3000');
  
  return new Promise((resolve) => {
    socket.on('connect', () => {
      console.log('🔌 Conectado ao WebSocket como observador');
      
      // Registrar como observador
      socket.emit('register', {
        userType: 'observer',
        userId: 'test-observer'
      });
      
      // Verificar se recebemos notificações
      socket.on('new_ride_request', (data) => {
        console.log('📨 NOTIFICAÇÃO RECEBIDA: Nova corrida disponível!', data);
      });
      
      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 5000);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Erro ao conectar WebSocket:', error.message);
      resolve();
    });
  });
}

// Executar testes em sequência
async function runTests() {
  console.log('🚀 Iniciando testes de criação de corrida...\n');
  
  // 1. Testar saúde da API
  const apiHealthy = await testApiHealth();
  if (!apiHealthy) {
    console.error('\n❌ API não está funcionando. Verifique se o servidor está rodando.');
    console.log('💡 Execute: cd api && npm start');
    return;
  }
  
  // 2. Criar corrida de teste
  const rideCreated = await testCreateRide();
  if (!rideCreated) {
    console.error('\n❌ Falha ao criar corrida. Verifique os logs do servidor.');
    return;
  }
  
  // 3. Verificar notificações WebSocket
  console.log('\n⏳ Aguardando 5 segundos para verificar notificações...');
  await checkConnectedDrivers();
  
  console.log('\n✅ Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Verifique os logs do servidor da API');
  console.log('2. Certifique-se de que há motoristas conectados');
  console.log('3. Verifique se os motoristas estão registrados como "driver"');
}

// Se executado diretamente
if (typeof window === 'undefined') {
  runTests().catch(console.error);
} else {
  // Se executado no navegador
  console.log('🌐 Executando no navegador...');
  
  window.testRideCreation = async () => {
    const apiHealthy = await testApiHealth();
    if (apiHealthy) {
      await testCreateRide();
    }
  };
  
  console.log('Use: testRideCreation() para testar');
}

export { testApiHealth, testCreateRide };