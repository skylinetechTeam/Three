// Script de teste para a Taxi API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 === TESTANDO TAXI API ===\n');

  try {
    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // 2. Registrar passageiro
    console.log('2️⃣ Registrando passageiro...');
    const passengerData = {
      name: 'Maria Santos',
      phone: '+244 912 345 678',
      email: 'maria@email.com',
      preferredPaymentMethod: 'cash'
    };
    
    const passengerResponse = await axios.post(`${API_BASE_URL}/passengers/register`, passengerData);
    const passengerId = passengerResponse.data.data.passengerId;
    console.log('✅ Passageiro registrado:', passengerResponse.data);
    console.log('');

    // 3. Registrar motorista
    console.log('3️⃣ Registrando motorista...');
    const driverData = {
      name: 'Carlos Silva',
      phone: '+244 923 456 789',
      email: 'carlos@email.com',
      licenseNumber: 'AB123456789',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'Branco',
        plate: 'LD-123-AB'
      },
      location: {
        lat: -8.8390,
        lng: 13.2894
      }
    };
    
    const driverResponse = await axios.post(`${API_BASE_URL}/drivers/register`, driverData);
    const driverId = driverResponse.data.data.driverId;
    console.log('✅ Motorista registrado:', driverResponse.data);
    console.log('');

    // 4. Colocar motorista online
    console.log('4️⃣ Colocando motorista online...');
    const statusResponse = await axios.put(`${API_BASE_URL}/drivers/${driverId}/status`, {
      isOnline: true,
      location: {
        lat: -8.8390,
        lng: 13.2894
      }
    });
    console.log('✅ Status do motorista:', statusResponse.data);
    console.log('');

    // 5. Criar solicitação de corrida
    console.log('5️⃣ Criando solicitação de corrida...');
    const rideRequestData = {
      passengerId: passengerId,
      passengerName: 'Maria Santos',
      passengerPhone: '+244 912 345 678',
      pickup: {
        address: 'Rua da Liberdade, 123, Luanda',
        lat: -8.8390,
        lng: 13.2894
      },
      destination: {
        address: 'Shopping Belas, Talatona',
        lat: -8.8500,
        lng: 13.3000
      },
      estimatedFare: 750,
      estimatedDistance: 12.5,
      estimatedTime: 25,
      paymentMethod: 'cash',
      vehicleType: 'standard',
      notes: 'Aguardando na entrada principal'
    };
    
    const rideResponse = await axios.post(`${API_BASE_URL}/rides/request`, rideRequestData);
    const rideId = rideResponse.data.data.rideId;
    console.log('✅ Corrida solicitada:', rideResponse.data);
    console.log('');

    // 6. Listar corridas pendentes
    console.log('6️⃣ Listando corridas pendentes...');
    const pendingResponse = await axios.get(`${API_BASE_URL}/rides/pending?driverLocation={"lat":-8.8390,"lng":13.2894}&radius=20`);
    console.log('✅ Corridas pendentes:', pendingResponse.data);
    console.log('');

    // 7. Motorista aceita a corrida
    console.log('7️⃣ Motorista aceitando corrida...');
    const acceptData = {
      driverId: driverId,
      driverName: 'Carlos Silva',
      driverPhone: '+244 923 456 789',
      vehicleInfo: driverData.vehicleInfo
    };
    
    const acceptResponse = await axios.put(`${API_BASE_URL}/rides/${rideId}/accept`, acceptData);
    console.log('✅ Corrida aceita:', acceptResponse.data);
    console.log('');

    // 8. Iniciar corrida
    console.log('8️⃣ Iniciando corrida...');
    const startData = {
      driverId: driverId,
      pickupLocation: {
        lat: -8.8390,
        lng: 13.2894
      }
    };
    
    const startResponse = await axios.put(`${API_BASE_URL}/rides/${rideId}/start`, startData);
    console.log('✅ Corrida iniciada:', startResponse.data);
    console.log('');

    // 9. Finalizar corrida
    console.log('9️⃣ Finalizando corrida...');
    const completeData = {
      driverId: driverId,
      dropoffLocation: {
        lat: -8.8500,
        lng: 13.3000
      },
      actualFare: 780,
      paymentConfirmed: true
    };
    
    const completeResponse = await axios.put(`${API_BASE_URL}/rides/${rideId}/complete`, completeData);
    console.log('✅ Corrida finalizada:', completeResponse.data);
    console.log('');

    // 10. Verificar histórico do passageiro
    console.log('🔟 Verificando histórico do passageiro...');
    const historyResponse = await axios.get(`${API_BASE_URL}/passengers/${passengerId}/rides`);
    console.log('✅ Histórico de corridas:', historyResponse.data);
    console.log('');

    console.log('🎉 === TESTE COMPLETO FINALIZADO ===');
    console.log('🚀 API funcionando perfeitamente!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste se arquivo for chamado diretamente
if (require.main === module) {
  // Aguardar um pouco para o servidor inicializar
  setTimeout(testAPI, 2000);
}

module.exports = { testAPI };