const io = require('socket.io-client');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';

// Test driver data
const testDriver = {
  id: 'test_driver_123',
  name: 'João Motorista Teste',
  phone: '+244 923 456 789',
  vehicle: {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'Branco',
    plate: 'LD-123-AB'
  }
};

class DriverSimulator {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.pendingRides = new Map();
  }

  // Connect to WebSocket as a driver
  connect() {
    console.log('🔌 Conectando motorista simulado...');
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Motorista conectado:', this.socket.id);
      this.isConnected = true;
      
      // Register as driver
      this.socket.emit('register', {
        userType: 'driver',
        userId: testDriver.id
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Motorista desconectado');
      this.isConnected = false;
    });

    // Listen for new ride requests
    this.socket.on('new_ride_request', (data) => {
      console.log('\n🚖 Nova solicitação de corrida recebida:', data);
      this.pendingRides.set(data.rideId, data);
      
      // Show ride details
      console.log(`📍 Origem: ${data.ride.pickup.address}`);
      console.log(`🎯 Destino: ${data.ride.destination.address}`);
      console.log(`💰 Tarifa estimada: ${data.ride.estimatedFare}`);
      console.log(`⏱️ Tempo estimado: ${data.ride.estimatedTime} min`);
      console.log(`👤 Passageiro: ${data.ride.passengerName}`);
      
      // Auto-accept or reject based on some logic (for testing)
      this.handleRideRequest(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error.message);
    });
  }

  // Handle incoming ride requests
  async handleRideRequest(rideData) {
    const { rideId, ride } = rideData;
    
    // Simulate thinking time
    console.log('🤔 Analisando solicitação...');
    await this.sleep(2000);

    // Decision logic (for testing purposes)
    const shouldAccept = Math.random() > 0.3; // 70% chance to accept
    
    if (shouldAccept) {
      await this.acceptRide(rideId);
    } else {
      await this.rejectRide(rideId, 'Muito longe da minha localização atual');
    }
  }

  // Accept a ride
  async acceptRide(rideId) {
    try {
      console.log(`✅ Aceitando corrida ${rideId}...`);
      
      const response = await axios.put(`${API_BASE_URL}/api/rides/${rideId}/accept`, {
        driverId: testDriver.id,
        driverName: testDriver.name,
        driverPhone: testDriver.phone,
        vehicleInfo: testDriver.vehicle
      });

      console.log('🎉 Corrida aceita com sucesso!');
      console.log('📤 Passageiro foi notificado via WebSocket');
      
      // Remove from pending rides
      this.pendingRides.delete(rideId);
      
      // Simulate starting the ride after some time
      setTimeout(() => {
        this.startRide(rideId);
      }, 10000); // Start ride after 10 seconds
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao aceitar corrida:', error.response?.data || error.message);
    }
  }

  // Reject a ride
  async rejectRide(rideId, reason = 'Não disponível') {
    try {
      console.log(`❌ Rejeitando corrida ${rideId}...`);
      
      const response = await axios.put(`${API_BASE_URL}/api/rides/${rideId}/reject`, {
        driverId: testDriver.id,
        reason: reason
      });

      console.log('📤 Rejeição enviada, passageiro foi notificado via WebSocket');
      
      // Remove from pending rides
      this.pendingRides.delete(rideId);
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao rejeitar corrida:', error.response?.data || error.message);
    }
  }

  // Start a ride (simulate driver arriving at pickup)
  async startRide(rideId) {
    try {
      console.log(`🚗 Iniciando corrida ${rideId}...`);
      
      const response = await axios.put(`${API_BASE_URL}/api/rides/${rideId}/start`, {
        driverId: testDriver.id,
        pickupLocation: {
          lat: -8.8390,
          lng: 13.2894,
          timestamp: new Date().toISOString()
        }
      });

      console.log('🚀 Corrida iniciada! Passageiro foi notificado.');
      
      // Simulate completing the ride after some time
      setTimeout(() => {
        this.completeRide(rideId);
      }, 15000); // Complete ride after 15 seconds
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao iniciar corrida:', error.response?.data || error.message);
    }
  }

  // Complete a ride
  async completeRide(rideId) {
    try {
      console.log(`🏁 Finalizando corrida ${rideId}...`);
      
      const response = await axios.put(`${API_BASE_URL}/api/rides/${rideId}/complete`, {
        driverId: testDriver.id,
        dropoffLocation: {
          lat: -8.8500,
          lng: 13.3000,
          timestamp: new Date().toISOString()
        },
        actualFare: 2500,
        paymentConfirmed: true
      });

      console.log('✅ Corrida finalizada com sucesso!');
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao finalizar corrida:', error.response?.data || error.message);
    }
  }

  // Utility function to sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('👋 Motorista desconectado');
    }
  }
}

// Create and start driver simulator
const driverSim = new DriverSimulator();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando simulador de motorista...');
  driverSim.disconnect();
  process.exit(0);
});

// Start simulation
console.log('🚗 Iniciando Simulador de Motorista');
console.log('📋 Dados do motorista teste:', testDriver);
console.log('🔗 Conectando ao servidor...');

driverSim.connect();

// Keep the process running
setInterval(() => {
  if (driverSim.isConnected) {
    console.log(`💚 Motorista online - Corridas pendentes: ${driverSim.pendingRides.size}`);
  } else {
    console.log('🔴 Motorista offline - tentando reconectar...');
  }
}, 30000); // Status check every 30 seconds