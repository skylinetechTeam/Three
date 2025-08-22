// Serviço para integração com a API Node.js
import io from 'socket.io-client';
import { API_CONFIG, ENDPOINTS } from '../config/api';

const API_BASE_URL = API_CONFIG.API_BASE_URL;
const SOCKET_URL = API_CONFIG.SOCKET_URL;

class ApiService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventCallbacks = new Map();
  }

  // Conectar ao WebSocket
  connectSocket(userType, userId) {
    try {
      console.log(`🔌 Tentando conectar WebSocket: ${SOCKET_URL}`);
      console.log(`👤 Usuário: ${userType} - ID: ${userId}`);

      // Desconectar socket existente
      if (this.socket) {
        console.log('🔄 Desconectando socket anterior...');
        this.socket.disconnect();
        this.socket = null;
      }

      // Configurações do Socket.IO com fallback
      const socketOptions = {
        transports: ['websocket', 'polling'], // Tentar WebSocket primeiro, depois polling
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        forceNew: true,
        autoConnect: true,
        // Headers para ngrok
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true'
        }
      };

      console.log('🔧 Configurações do Socket:', socketOptions);

      this.socket = io(SOCKET_URL, socketOptions);

      // Event listeners
      this.socket.on('connect', () => {
        console.log('✅ Socket conectado com sucesso!');
        console.log('🆔 Socket ID:', this.socket.id);
        this.isConnected = true;
        
        // Registrar usuário
        console.log('📝 Registrando usuário...', { userType, userId });
        this.socket.emit('register', {
          userType: userType, // 'driver' ou 'passenger'
          userId: userId
        });

        // Configurar listeners de eventos de corrida
        this.setupRideEventListeners();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket desconectado. Motivo:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão Socket:', error.message);
        console.error('📍 URL tentada:', SOCKET_URL);
        console.error('🔧 Tipo do erro:', error.type);
        this.isConnected = false;
        
        // Log detalhado do erro
        if (error.description) {
          console.error('📝 Descrição:', error.description);
        }
        if (error.context) {
          console.error('🔍 Contexto:', error.context);
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconectado após ${attemptNumber} tentativas`);
        this.isConnected = true;
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Tentativa de reconexão #${attemptNumber}`);
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ Erro na reconexão:', error.message);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('💀 Falha total na reconexão. Máximo de tentativas atingido.');
        this.isConnected = false;
      });

      // Testar conexão básica
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          console.log('✅ Socket está conectado e funcionando');
          // Enviar ping de teste
          this.socket.emit('ping', { timestamp: Date.now() });
        } else {
          console.warn('⚠️ Socket não conectou dentro do tempo esperado');
          console.log('🔍 Estado atual do socket:', {
            connected: this.socket?.connected,
            id: this.socket?.id,
            transport: this.socket?.io?.engine?.transport?.name
          });
        }
      }, 3000);

      return this.socket;
    } catch (error) {
      console.error('💥 Erro fatal ao criar socket:', error);
      this.isConnected = false;
      return null;
    }
  }

  // Registrar callback para eventos específicos
  onEvent(eventName, callback) {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    this.eventCallbacks.get(eventName).push(callback);
    
    // Se o socket já existe, adicionar o listener imediatamente
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  // Remover callback de evento
  offEvent(eventName, callback) {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  // Configurar listeners para eventos de corrida
  setupRideEventListeners() {
    if (!this.socket) return;

    console.log('🎯 Configurando listeners de eventos de corrida...');

    // Setup ride event listeners
    this.socket.on('ride_accepted', (data) => {
      console.log('🎉 [ApiService] ride_accepted recebido:', data);
      this.triggerCallbacks('ride_accepted', data);
    });

    this.socket.on('ride_rejected', (data) => {
      console.log('❌ [ApiService] ride_rejected recebido:', data);
      this.triggerCallbacks('ride_rejected', data);
    });

    this.socket.on('ride_started', (data) => {
      console.log('🚗 [ApiService] ride_started recebido:', data);
      this.triggerCallbacks('ride_started', data);
    });

    this.socket.on('ride_completed', (data) => {
      console.log('✅ [ApiService] ride_completed recebido:', data);
      this.triggerCallbacks('ride_completed', data);
    });

    this.socket.on('ride_cancelled', (data) => {
      console.log('❌ [ApiService] ride_cancelled recebido:', data);
      this.triggerCallbacks('ride_cancelled', data);
    });

    this.socket.on('no_drivers_available', (data) => {
      console.log('🚫 [ApiService] no_drivers_available recebido:', data);
      this.triggerCallbacks('no_drivers_available', data);
    });

    this.socket.on('driver_location_update', (data) => {
      console.log('📍 [ApiService] driver_location_update recebido:', data);
      this.triggerCallbacks('driver_location_update', data);
    });
  }

  // Trigger callbacks for a specific event
  triggerCallbacks(eventName, data) {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Erro ao executar callback para ${eventName}:`, error);
        }
      });
    }
  }

  // Desconectar WebSocket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // === ENDPOINTS DE CORRIDAS ===

  // Criar nova solicitação de corrida
  async createRideRequest(rideData) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rideData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar solicitação');
      }

      console.log('✅ Solicitação criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      throw error;
    }
  }

  // Aceitar corrida (motorista)
  async acceptRide(rideId, driverData) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao aceitar corrida');
      }

      console.log('✅ Corrida aceita:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao aceitar corrida:', error);
      throw error;
    }
  }

  // Rejeitar corrida (motorista)
  async rejectRide(rideId, driverId, reason) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId, reason }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao rejeitar corrida');
      }

      console.log('✅ Corrida rejeitada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao rejeitar corrida:', error);
      throw error;
    }
  }

  // Iniciar corrida
  async startRide(rideId, driverId, pickupLocation) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId, pickupLocation }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao iniciar corrida');
      }

      console.log('✅ Corrida iniciada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao iniciar corrida:', error);
      throw error;
    }
  }

  // Finalizar corrida
  async completeRide(rideId, driverId, completionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId, ...completionData }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao finalizar corrida');
      }

      console.log('✅ Corrida finalizada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao finalizar corrida:', error);
      throw error;
    }
  }

  // Cancelar corrida
  async cancelRide(rideId, userId, userType, reason) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userType, reason }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao cancelar corrida');
      }

      console.log('✅ Corrida cancelada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao cancelar corrida:', error);
      throw error;
    }
  }

  // Buscar corridas pendentes
  async getPendingRides(driverLocation, radius = 10) {
    try {
      const params = new URLSearchParams();
      if (driverLocation) {
        params.append('driverLocation', JSON.stringify(driverLocation));
      }
      params.append('radius', radius.toString());

      const response = await fetch(`${API_BASE_URL}/rides/pending?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar corridas');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar corridas pendentes:', error);
      throw error;
    }
  }

  // Atualizar localização durante corrida
  async updateRideLocation(rideId, driverId, location) {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId, location }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar localização');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar localização:', error);
      throw error;
    }
  }

  // === ENDPOINTS DE MOTORISTAS ===

  // Registrar motorista
  async registerDriver(driverData) {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar motorista');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao registrar motorista:', error);
      throw error;
    }
  }

  // Atualizar status do motorista
  async updateDriverStatus(driverId, isOnline, location) {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline, location }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar status');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  }

  // Atualizar localização do motorista
  async updateDriverLocation(driverId, location) {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar localização');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar localização:', error);
      throw error;
    }
  }

  // Buscar motoristas próximos
  async getNearbyDrivers(lat, lng, radius = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/drivers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar motoristas');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar motoristas próximos:', error);
      throw error;
    }
  }

  // === ENDPOINTS DE PASSAGEIROS ===

  // Registrar passageiro
  async registerPassenger(passengerData) {
    try {
      console.log(API_CONFIG.API_BASE_URL)
      const response = await fetch(`${API_BASE_URL}/passengers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passengerData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar passageiro');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao registrar passageiro:', error, );
      throw error;
    }
  }

  // Obter histórico de corridas do passageiro
  async getPassengerRides(passengerId, limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/passengers/${passengerId}/rides?limit=${limit}&offset=${offset}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar histórico');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // === UTILITÁRIOS ===

  // Testar conectividade da API
  async testApiConnection() {
    try {
      console.log('🔍 Testando conectividade da API...');
      console.log('📍 URL base:', API_BASE_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
      
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API está funcionando:', data);
        return { success: true, data };
      } else {
        console.error('❌ API retornou erro:', response.status, response.statusText);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error('💥 Erro ao testar API:', error.message);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Timeout - API não respondeu em 5 segundos' };
      }
      
      return { success: false, error: error.message };
    }
  }

     // Conectar ao WebSocket com verificação prévia
   async connectSocketWithCheck(userType, userId) {
     try {
       // Primeiro, testar se a API está funcionando
       console.log('🔍 Verificando API antes de conectar WebSocket...');
       const apiTest = await this.testApiConnection();
       
       if (!apiTest.success) {
         console.error('❌ API não está funcionando. Não é possível conectar WebSocket.');
         console.error('💡 Erro:', apiTest.error);
         return null;
       }
       
       console.log('✅ API está funcionando. Conectando WebSocket...');
       return this.connectSocket(userType, userId);
       
     } catch (error) {
       console.error('💥 Erro na verificação prévia:', error);
       return null;
     }
   }

   // Método de debug para testar notificações
   testRideAcceptedNotification(rideId, passengerId) {
     if (this.socket && this.socket.connected) {
       console.log('🧪 Testando notificação ride_accepted...');
       
       const testData = {
         rideId: rideId,
         ride: {
           id: rideId,
           passengerId: passengerId,
           status: 'accepted'
         },
         driver: {
           id: 'test-driver-123',
           name: 'Motorista Teste',
           phone: '+244 900 000 000',
           vehicleInfo: {
             make: 'Toyota',
             model: 'Corolla',
             color: 'Branco',
             plate: 'LD-12-34-AB'
           }
         },
         estimatedArrival: '3-5 minutos'
       };
       
       this.socket.emit('test_ride_accepted', testData);
       console.log('📤 Evento de teste enviado:', testData);
       
       return testData;
     } else {
       console.error('❌ Socket não está conectado para teste');
       return null;
     }
   }

  // Calcular preço estimado da corrida
  calculateEstimatedFare(distance, time, vehicleType = 'standard') {
    const baseFare = 200; // Taxa base em AOA
    const perKmRate = vehicleType === 'premium' ? 80 : 50; // AOA por km
    const perMinuteRate = vehicleType === 'premium' ? 15 : 10; // AOA por minuto
    
    const distanceFare = distance * perKmRate;
    const timeFare = time * perMinuteRate;
    
    return Math.round(baseFare + distanceFare + timeFare);
  }

  // Calcular distância entre dois pontos
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  // Estimar tempo de viagem
  estimateTravelTime(distance, averageSpeed = 25) {
    return Math.round((distance / averageSpeed) * 60); // em minutos
  }
}

// Singleton instance
const apiService = new ApiService();

export default apiService;

// Exemplo de uso no React Native:
/*

import ApiService from '../services/apiService';

// 1. Conectar socket (no componentDidMount ou useEffect)
const socket = ApiService.connectSocket('passenger', 'user_123');

// 2. Escutar eventos
socket.on('new_ride_request', (data) => {
  console.log('Nova corrida:', data);
});

socket.on('ride_accepted', (data) => {
  console.log('Corrida aceita:', data);
  // Atualizar UI
});

// 3. Criar solicitação de corrida
const createRide = async () => {
  try {
    const rideData = {
      passengerId: 'user_123',
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
      estimatedFare: ApiService.calculateEstimatedFare(5.2, 15),
      estimatedDistance: 5.2,
      estimatedTime: 15,
      paymentMethod: 'cash'
    };

    const result = await ApiService.createRideRequest(rideData);
    console.log('Corrida criada:', result);
    
    return result;
  } catch (error) {
    console.error('Erro:', error);
  }
};

// 4. Aceitar corrida (motorista)
const acceptRide = async (rideId) => {
  try {
    const driverData = {
      driverId: 'driver_456',
      driverName: 'Carlos Silva',
      driverPhone: '+244 923 456 789',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'Branco',
        plate: 'LD-123-AB'
      }
    };

    const result = await ApiService.acceptRide(rideId, driverData);
    console.log('Corrida aceita:', result);
    
    return result;
  } catch (error) {
    console.error('Erro:', error);
  }
};

*/