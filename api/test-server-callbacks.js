/**
 * Script de Teste para Sistema de Callbacks - Lado Servidor
 * 
 * Este script permite testar o sistema de callbacks do lado servidor
 * para diagnosticar problemas de entrega de notificações.
 */

const fetch = require('node-fetch');
const io = require('socket.io-client');

class ServerCallbackTester {
  constructor(apiUrl = 'http://localhost:3000', socketUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
    this.socketUrl = socketUrl;
    this.sockets = new Map();
    this.receivedEvents = [];
  }

  /**
   * Criar conexão WebSocket de teste
   */
  async createTestConnection(userType, userId) {
    console.log(`🔌 Criando conexão de teste: ${userType} - ${userId}`);
    
    const socket = io(this.socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log(`✅ Socket conectado: ${socket.id}`);
        
        // Registrar usuário
        socket.emit('register', { userType, userId });
        
        // Confirmar registro
        socket.on('registration_confirmed', (data) => {
          console.log(`✅ Registro confirmado:`, data);
          this.sockets.set(userId, socket);
          resolve(socket);
        });
        
        // Se não receber confirmação, assumir sucesso após timeout
        setTimeout(() => {
          this.sockets.set(userId, socket);
          resolve(socket);
        }, 2000);
      });

      socket.on('connect_error', (error) => {
        console.error(`❌ Erro de conexão: ${error.message}`);
        reject(error);
      });

      // Capturar todos os eventos
      socket.onAny((eventName, data) => {
        console.log(`📨 Evento recebido [${userId}]: ${eventName}`, data);
        this.receivedEvents.push({
          userId,
          eventName,
          data,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * Testar API de saúde
   */
  async testApiHealth() {
    console.log('🔍 Testando API health...');
    
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API está funcionando:', data);
        return true;
      } else {
        console.error('❌ API retornou erro:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com API:', error.message);
      return false;
    }
  }

  /**
   * Registrar passageiro de teste
   */
  async registerTestPassenger(passengerId = 'test-passenger-001') {
    console.log(`👤 Registrando passageiro de teste: ${passengerId}`);
    
    const passengerData = {
      name: 'Passageiro Teste',
      phone: '+244 900 000 001',
      email: 'test@example.com'
    };

    try {
      const response = await fetch(`${this.apiUrl}/api/passengers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passengerData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Passageiro registrado:', result);
        return result.data.passengerId;
      } else {
        console.error('❌ Erro ao registrar passageiro:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
      return null;
    }
  }

  /**
   * Criar corrida de teste
   */
  async createTestRide(passengerId) {
    console.log(`🚖 Criando corrida de teste para passageiro: ${passengerId}`);
    
    const rideData = {
      passengerId: passengerId,
      passengerName: 'Passageiro Teste',
      pickup: {
        address: 'Local de Teste A',
        lat: -8.8390,
        lng: 13.2894
      },
      destination: {
        address: 'Local de Teste B',
        lat: -8.8500,
        lng: 13.3000
      },
      estimatedFare: 500,
      estimatedDistance: 5.2,
      estimatedTime: 15,
      paymentMethod: 'cash'
    };

    try {
      const response = await fetch(`${this.apiUrl}/api/rides/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rideData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Corrida criada:', result);
        return result.data.rideId;
      } else {
        console.error('❌ Erro ao criar corrida:', result);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
      return null;
    }
  }

  /**
   * Aceitar corrida como motorista de teste
   */
  async acceptTestRide(rideId) {
    console.log(`✅ Aceitando corrida de teste: ${rideId}`);
    
    const driverData = {
      driverId: 'test-driver-001',
      driverName: 'Motorista Teste',
      driverPhone: '+244 900 000 002',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'Branco',
        plate: 'TEST-001'
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}/api/rides/${rideId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Corrida aceita:', result);
        return true;
      } else {
        console.error('❌ Erro ao aceitar corrida:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
      return false;
    }
  }

  /**
   * Teste completo do fluxo de callback
   */
  async runCompleteCallbackTest() {
    console.log('🚀 Iniciando teste completo de callbacks...');
    this.receivedEvents = [];
    
    try {
      // 1. Testar API
      const apiHealthy = await this.testApiHealth();
      if (!apiHealthy) {
        throw new Error('API não está funcionando');
      }

      // 2. Registrar passageiro
      const passengerId = await this.registerTestPassenger();
      if (!passengerId) {
        throw new Error('Falha ao registrar passageiro');
      }

      // 3. Conectar passageiro via WebSocket
      await this.createTestConnection('passenger', passengerId);
      
      // Aguardar conexão estabilizar
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Criar corrida
      const rideId = await this.createTestRide(passengerId);
      if (!rideId) {
        throw new Error('Falha ao criar corrida');
      }

      // 5. Aguardar um pouco para garantir que o request foi processado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 6. Aceitar corrida
      console.log('⏳ Aguardando antes de aceitar corrida...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const accepted = await this.acceptTestRide(rideId);
      if (!accepted) {
        throw new Error('Falha ao aceitar corrida');
      }

      // 7. Aguardar callbacks chegarem
      console.log('⏳ Aguardando callbacks chegarem...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 8. Analisar resultados
      this.analyzeResults(passengerId, rideId);

    } catch (error) {
      console.error('❌ Erro no teste completo:', error.message);
    } finally {
      // Limpar conexões
      this.cleanup();
    }
  }

  /**
   * Analisar resultados dos testes
   */
  analyzeResults(passengerId, rideId) {
    console.log('\n📊 ANÁLISE DOS RESULTADOS:');
    console.log('=' .repeat(50));
    
    console.log(`Passageiro ID: ${passengerId}`);
    console.log(`Corrida ID: ${rideId}`);
    console.log(`Total de eventos recebidos: ${this.receivedEvents.length}`);
    
    if (this.receivedEvents.length === 0) {
      console.log('❌ NENHUM evento foi recebido!');
      console.log('\n🔍 Possíveis causas:');
      console.log('1. Socket não foi registrado corretamente');
      console.log('2. IDs não coincidem (string vs number)');
      console.log('3. Socket foi desconectado silenciosamente');
      console.log('4. Servidor não encontrou o passageiro nas conexões ativas');
      return;
    }

    console.log('\n📋 Eventos recebidos:');
    this.receivedEvents.forEach((event, index) => {
      console.log(`${index + 1}. [${event.timestamp}] ${event.eventName}`);
      if (event.eventName === 'ride_accepted') {
        console.log(`   ✅ RIDE_ACCEPTED recebido! Callback funcionando.`);
      }
    });

    // Verificar se ride_accepted foi recebido
    const rideAcceptedEvents = this.receivedEvents.filter(e => e.eventName === 'ride_accepted');
    
    if (rideAcceptedEvents.length > 0) {
      console.log('\n🎉 SUCESSO! Callback ride_accepted foi recebido.');
      console.log('✅ Sistema de callbacks está funcionando corretamente.');
    } else {
      console.log('\n❌ FALHA! Callback ride_accepted NÃO foi recebido.');
      console.log('🔍 Verificar logs do servidor para mais detalhes.');
    }
    
    console.log('=' .repeat(50));
  }

  /**
   * Limpar recursos
   */
  cleanup() {
    console.log('🧹 Limpando recursos...');
    
    for (const [userId, socket] of this.sockets.entries()) {
      console.log(`🔌 Desconectando socket: ${userId}`);
      socket.disconnect();
    }
    
    this.sockets.clear();
  }

  /**
   * Teste rápido de conectividade
   */
  async quickConnectivityTest() {
    console.log('⚡ Teste rápido de conectividade...');
    
    try {
      // Testar API
      const apiOk = await this.testApiHealth();
      
      // Testar WebSocket
      const socket = await this.createTestConnection('passenger', 'quick-test-001');
      
      console.log('✅ Teste de conectividade concluído com sucesso!');
      
      // Limpar
      socket.disconnect();
      
      return true;
    } catch (error) {
      console.error('❌ Falha no teste de conectividade:', error.message);
      return false;
    }
  }
}

// Função principal para executar testes
async function runTests() {
  const tester = new ServerCallbackTester();
  
  console.log('🧪 INICIANDO TESTES DO SISTEMA DE CALLBACKS');
  console.log('=' .repeat(60));
  
  // Teste de conectividade básica
  console.log('\n1️⃣ Teste de Conectividade Básica');
  await tester.quickConnectivityTest();
  
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste completo de callbacks
  console.log('\n2️⃣ Teste Completo de Callbacks');
  await tester.runCompleteCallbackTest();
  
  console.log('\n🏁 TESTES CONCLUÍDOS');
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = ServerCallbackTester;