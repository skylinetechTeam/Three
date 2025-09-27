// Teste do sistema de corridas agendadas
const moment = require('moment');

// Simular criação de corrida agendada
function testScheduledRide() {
  console.log('🧪 TESTE: Sistema de corridas agendadas\n');
  
  // Corrida imediata
  const immediateRide = {
    passengerId: 'pass123',
    passengerName: 'João Silva',
    pickup: { address: 'Rua A, 123', lat: -23.5505, lng: -46.6333 },
    destination: { address: 'Rua B, 456', lat: -23.5525, lng: -46.6353 },
    estimatedFare: 25.50,
    estimatedDistance: 5.2,
    estimatedTime: 15,
    // Sem scheduledTime = corrida imediata
  };
  
  console.log('📍 Corrida imediata:', {
    ...immediateRide,
    expectedStatus: 'pending',
    expectedNotification: 'Imediata para motoristas'
  });
  
  // Corrida agendada para daqui a 2 minutos
  const scheduledTime = moment().add(2, 'minutes').toISOString();
  const scheduledRide = {
    passengerId: 'pass456',
    passengerName: 'Maria Santos',
    pickup: { address: 'Rua C, 789', lat: -23.5515, lng: -46.6343 },
    destination: { address: 'Rua D, 101', lat: -23.5535, lng: -46.6363 },
    estimatedFare: 18.75,
    estimatedDistance: 3.8,
    estimatedTime: 12,
    scheduledTime: scheduledTime
  };
  
  console.log('\n⏰ Corrida agendada:', {
    ...scheduledRide,
    scheduledTimeFormatted: moment(scheduledTime).format('DD/MM/YYYY HH:mm:ss'),
    expectedStatus: 'scheduled',
    expectedNotification: 'Aguardando horário'
  });
  
  // Corrida agendada para o passado (deve ser imediata)
  const pastTime = moment().subtract(5, 'minutes').toISOString();
  const pastScheduledRide = {
    passengerId: 'pass789',
    passengerName: 'Pedro Costa',
    pickup: { address: 'Rua E, 321', lat: -23.5525, lng: -46.6353 },
    destination: { address: 'Rua F, 654', lat: -23.5545, lng: -46.6373 },
    estimatedFare: 22.00,
    estimatedDistance: 4.5,
    estimatedTime: 18,
    scheduledTime: pastTime
  };
  
  console.log('\n⚠️ Corrida "agendada" no passado:', {
    ...pastScheduledRide,
    scheduledTimeFormatted: moment(pastTime).format('DD/MM/YYYY HH:mm:ss'),
    expectedStatus: 'pending (convertida para imediata)',
    expectedNotification: 'Imediata para motoristas'
  });
  
  console.log('\n🔄 FLUXO ESPERADO:');
  console.log('1. Corrida imediata → status: pending → notifica motoristas');
  console.log('2. Corrida agendada → status: scheduled → aguarda no scheduler');
  console.log('3. Scheduler verifica a cada minuto → ativa corridas no horário');
  console.log('4. Corrida ativada → status: pending → notifica motoristas');
  console.log('5. Se não aceita em 30s → status: expired → notifica passageiro\n');
  
  console.log('✅ Para testar, use as seguintes requisições:\n');
  
  // Exemplo de requisição para corrida imediata
  console.log('📱 CORRIDA IMEDIATA:');
  console.log('POST /api/rides/request');
  console.log(JSON.stringify(immediateRide, null, 2));
  
  console.log('\n📅 CORRIDA AGENDADA:');
  console.log('POST /api/rides/request');
  console.log(JSON.stringify(scheduledRide, null, 2));
  
  console.log('\n🔍 VERIFICAR CORRIDAS AGENDADAS:');
  console.log('GET /api/rides?status=scheduled');
  
  console.log('\n📊 ESTATÍSTICAS:');
  console.log('GET /api/rides (deve incluir status "scheduled" nas estatísticas)');
}

testScheduledRide();