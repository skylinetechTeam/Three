// Serviço para integração com a API Node.js
import io from 'socket.io-client';
import { API_CONFIG, ENDPOINTS } from '../config/api';
import debugLogger from '../utils/DebugLogger';
import { normalizeId } from '../utils/idNormalizer';

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
    const perfKey = debugLogger.performance.measureStart('websocket_connection');
    
    try {
      debugLogger.websocket.connecting(SOCKET_URL, { userType, userId });
      
      // Armazenar informações do usuário para reconexão
      this.userType = userType;
      this.userId = normalizeId(userId);

      // Desconectar socket existente
      if (this.socket) {
        debugLogger.debug('websocket', 'Desconectando socket anterior...');
        this.disconnectSocket();
      }

      // Configurações do Socket.IO com fallback melhorado
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

      debugLogger.debug('websocket', 'Configurações do Socket', socketOptions);

      this.socket = io(SOCKET_URL, socketOptions);

      // Event listeners
      this.socket.on('connect', () => {
        debugLogger.websocket.connected(this.socket.id, userType, userId);
        debugLogger.performance.measureEnd(perfKey, 'websocket_connection', {
          socketId: this.socket.id,
          transport: this.socket.io?.engine?.transport?.name
        });
        
        this.isConnected = true;
        
        // REGISTRO IMEDIATO após conexão
        console.log('🔌 [ApiService] Socket conectado, registrando usuário IMEDIATAMENTE');
        const registrationData = {
          userType: userType, // 'driver' ou 'passenger'
          userId: normalizeId(userId) // Garantir que sempre seja string normalizada
        };
        
        console.log('📋 [ApiService] Dados de registro:', registrationData);
        this.socket.emit('register', registrationData);
        
        // Aguardar confirmação de registro
        this.socket.once('registration_confirmed', (confirmData) => {
          console.log('✅ [ApiService] Registro confirmado pelo servidor:', confirmData);
        });
        
        // Timeout para caso não receba confirmação
        setTimeout(() => {
          console.log('⚠️ [ApiService] Verificando se registro foi bem-sucedido...');
          // Re-registrar se necessário após 1 segundo
          this.socket.emit('register', registrationData);
        }, 1000);

        // Configurar listeners de eventos de corrida
        this.setupRideEventListeners();
        
        // CRÍTICO: Registrar callbacks pendentes após conexão
        this.registerPendingCallbacks();
      });

      this.socket.on('disconnect', (reason) => {
        debugLogger.websocket.disconnected(reason, true);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        debugLogger.websocket.error(error, {
          url: SOCKET_URL,
          userType,
          userId
        });
        this.isConnected = false;
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
    console.log(`📝 [ApiService] Registrando callback para evento: ${eventName}`);
    
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    
    // Verificar se callback já existe para evitar duplicatas
    const existingCallbacks = this.eventCallbacks.get(eventName);
    if (!existingCallbacks.includes(callback)) {
      existingCallbacks.push(callback);
      console.log(`✅ [ApiService] Callback registrado. Total para ${eventName}: ${existingCallbacks.length}`);
    } else {
      console.warn(`⚠️ [ApiService] Callback já existe para ${eventName}, ignorando duplicata`);
    }
    
    // Se o socket já existe e está conectado, adicionar o listener imediatamente
    if (this.socket && this.socket.connected) {
      console.log(`🔌 [ApiService] Socket conectado, adicionando listener direto para: ${eventName}`);
      
      // Verificar se já existe listener para evitar duplicatas
      const hasListener = this.socket.hasListeners && this.socket.hasListeners(eventName);
      if (!hasListener) {
        this.socket.on(eventName, callback);
        console.log(`✅ [ApiService] Listener adicionado diretamente para: ${eventName}`);
      } else {
        console.log(`ℹ️ [ApiService] Listener já existe para: ${eventName}`);
      }
    } else {
      console.log(`⚠️ [ApiService] Socket não conectado, callback será adicionado quando conectar`);
    }
    
    // Retornar função para remover callback
    return () => {
      this.offEvent(eventName, callback);
    };
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

  // Registrar callbacks pendentes após conexão
  registerPendingCallbacks() {
    console.log('🔄 [ApiService] Registrando callbacks pendentes...');
    console.log(`🆔 [ApiService] Socket ID: ${this.socket?.id}`);
    console.log(`👤 [ApiService] User Type: ${this.userType}, User ID: ${this.userId}`);
    
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ [ApiService] Socket não está conectado, abortando registro de callbacks pendentes');
      return;
    }
    
    // Registrar todos os callbacks que foram adicionados antes da conexão
    console.log(`📦 [ApiService] Total de eventos para registrar: ${this.eventCallbacks.size}`);
    
    for (const [eventName, callbacks] of this.eventCallbacks.entries()) {
      console.log(`🎯 [ApiService] Registrando ${callbacks.length} callbacks pendentes para: ${eventName}`);
      
      // Limpar listeners existentes para evitar duplicatas
      this.socket.removeAllListeners(eventName);
      
      callbacks.forEach((callback, index) => {
        this.socket.on(eventName, callback);
        console.log(`✅ [ApiService] Callback ${index + 1} registrado para: ${eventName}`);
      });
    }
    
    // Listar todos os eventos que têm listeners agora
    const allEvents = this.socket.eventNames();
    console.log(`📡 [ApiService] Eventos com listeners ativos:`, allEvents);
    
    console.log('✅ [ApiService] Todos os callbacks pendentes foram registrados');
  }

  // Configurar listeners para eventos de corrida
  setupRideEventListeners() {
    if (!this.socket) {
      console.warn('⚠️ [setupRideEventListeners] Socket não existe, abortando configuração');
      return;
    }

    console.log('🎯 Configurando listeners de eventos de corrida...');
    console.log('📊 [ApiService] Callbacks registrados até agora:', Array.from(this.eventCallbacks.keys()));
    
    // Configurar callbacks já registrados
    this.eventCallbacks.forEach((callbacks, eventName) => {
      console.log(`🔄 [ApiService] Configurando ${callbacks.length} callbacks para evento: ${eventName}`);
      
      // Remover listeners existentes para evitar duplicatas
      this.socket.removeAllListeners(eventName);
      
      callbacks.forEach((callback, index) => {
        console.log(`➕ [ApiService] Adicionando callback ${index + 1} para: ${eventName}`);
        this.socket.on(eventName, callback);
      });
    });

    // Setup ride event listeners com melhor tratamento de erros
    const setupEventListener = (eventName, handler) => {
      // Remover listener existente se houver
      this.socket.removeAllListeners(eventName);
      
      this.socket.on(eventName, (data) => {
        try {
          console.log(`🎉 [ApiService] ${eventName} recebido:`, data);
          console.log(`🔍 [ApiService] Socket ID que recebeu: ${this.socket.id}`);
          
          // Chamar handler customizado
          handler(data);
          
          // Disparar callbacks registrados
          this.triggerCallbacks(eventName, data);
          
        } catch (error) {
          console.error(`❌ [ApiService] Erro ao processar evento ${eventName}:`, error);
        }
      });
      
      console.log(`✅ [ApiService] Listener configurado para: ${eventName}`);
    };

    // Configurar listeners para eventos principais
    setupEventListener('ride_accepted', (data) => {
      console.log('🎉 [ApiService] RIDE_ACCEPTED - Processamento iniciado');
      console.log('📊 [ApiService] Dados completos recebidos:', JSON.stringify(data, null, 2));
      
      // Validar dados essenciais
      if (!data.rideId) {
        console.warn('⚠️ [ApiService] ride_accepted sem rideId');
      }
      if (!data.driver) {
        console.warn('⚠️ [ApiService] ride_accepted sem dados do motorista');
      }
      
      console.log('📊 [ApiService] Dados validados do ride_accepted:', {
        hasRideId: !!data.rideId,
        hasDriver: !!data.driver,
        driverName: data.driver?.name,
        estimatedArrival: data.estimatedArrival,
        ridePassengerId: data.ride?.passengerId,
        currentUserId: this.userId
      });
    });

    setupEventListener('ride_rejected', (data) => {
      console.log('❌ [ApiService] RIDE_REJECTED - Motivo:', data.reason);
    });

    setupEventListener('ride_started', (data) => {
      console.log('🚗 [ApiService] RIDE_STARTED - Corrida iniciada');
      console.log('📍 [ApiService] Destino da corrida:', data.ride?.destination);
    });

    setupEventListener('ride_started_manual', (data) => {
      console.log('🚗 [ApiService] RIDE_STARTED_MANUAL - Evento manual recebido');
      // Redirecionar para o handler de ride_started
      this.triggerCallbacks('ride_started', data);
    });

    setupEventListener('ride_completed', (data) => {
      console.log('✅ [ApiService] RIDE_COMPLETED - Corrida finalizada');
    });

    setupEventListener('ride_cancelled', (data) => {
      console.log('❌ [ApiService] RIDE_CANCELLED - Corrida cancelada por:', data.cancelledBy);
    });

    setupEventListener('no_drivers_available', (data) => {
      console.log('🚫 [ApiService] NO_DRIVERS_AVAILABLE - Nenhum motorista disponível');
    });

    setupEventListener('driver_location_update', (data) => {
      // Log menos verboso para updates frequentes de localização
      if (Math.random() < 0.1) { // Log apenas 10% das atualizações
        console.log('📍 [ApiService] DRIVER_LOCATION_UPDATE - Localização atualizada');
      }
    });
    
    // Listener global para capturar TODOS os eventos (debugging)
    if (this.socket.onAny) {
      this.socket.onAny((eventName, ...args) => {
        // Filtrar eventos muito frequentes
        if (!['driver_location_update', 'ping', 'pong'].includes(eventName)) {
          console.log(`🌐 [DEBUG] Evento global capturado: ${eventName}`, args);
        }
      });
    }
    
    // Configurar heartbeat para manter conexão ativa
    this.setupHeartbeat();
    
    console.log('✅ [ApiService] Todos os listeners de eventos configurados com sucesso');
  }

  // Trigger callbacks for a specific event
  triggerCallbacks(eventName, data) {
    console.log(`🔔 [ApiService] Tentando executar callbacks para: ${eventName}`);
    console.log(`📦 [ApiService] Dados recebidos:`, JSON.stringify(data, null, 2));
    const callbacks = this.eventCallbacks.get(eventName);
    console.log(`📋 [ApiService] Callbacks registrados para ${eventName}:`, callbacks ? callbacks.length : 0);
    console.log(`🗺️ [ApiService] Todos os eventos registrados:`, Array.from(this.eventCallbacks.keys()));
    
    if (callbacks && callbacks.length > 0) {
      console.log(`▶️ [ApiService] Executando ${callbacks.length} callbacks para ${eventName}`);
      
      let successCount = 0;
      let errorCount = 0;
      
      callbacks.forEach((callback, index) => {
        try {
          console.log(`🎯 [ApiService] Executando callback ${index + 1}/${callbacks.length} para ${eventName}`);
          
          // Verificar se callback é função válida
          if (typeof callback !== 'function') {
            console.error(`❌ [ApiService] Callback ${index + 1} não é uma função:`, typeof callback);
            errorCount++;
            return;
          }
          
          // Executar callback com timeout de segurança
          const timeoutId = setTimeout(() => {
            console.warn(`⚠️ [ApiService] Callback ${index + 1} para ${eventName} demorou mais de 5s`);
          }, 5000);
          
          callback(data);
          clearTimeout(timeoutId);
          
          console.log(`✅ [ApiService] Callback ${index + 1} executado com sucesso`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ [ApiService] Erro ao executar callback ${index + 1} para ${eventName}:`, error);
          console.error(`🔍 [ApiService] Stack trace:`, error.stack);
          errorCount++;
        }
      });
      
      console.log(`📊 [ApiService] Execução completa para ${eventName}: ${successCount} sucessos, ${errorCount} erros`);
      
      // Se todos falharam, algo está muito errado
      if (errorCount > 0 && successCount === 0) {
        console.error(`🚨 [ApiService] TODOS os callbacks falharam para ${eventName}! Possível problema crítico.`);
      }
      
    } else {
      console.warn(`⚠️ [ApiService] Nenhum callback registrado para evento: ${eventName}`);
      console.log(`📊 [ApiService] Eventos com callbacks registrados:`, Array.from(this.eventCallbacks.keys()));
      
      // Sugestão de debugging
      if (this.eventCallbacks.size === 0) {
        console.warn(`🔍 [ApiService] DEBUGGING: Nenhum callback registrado em absoluto. Verifique se onEvent() foi chamado.`);
      }
    }
  }

  // Desconectar WebSocket
  disconnectSocket() {
    if (this.socket) {
      console.log('🔌 [ApiService] Desconectando socket...');
      
      // Limpar heartbeat
      this.clearHeartbeat();
      
      // Limpar todos os listeners
      this.socket.removeAllListeners();
      
      // Desconectar
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      console.log('✅ [ApiService] Socket desconectado com sucesso');
    }
  }
  
  // Configurar heartbeat para manter conexão ativa
  setupHeartbeat() {
    // Limpar heartbeat existente
    this.clearHeartbeat();
    
    console.log('💓 [ApiService] Configurando heartbeat melhorado...');
    
    // Variável para controlar último ping
    let lastPingTime = 0;
    
    // Enviar ping a cada 25 segundos para evitar sobrecarga
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        const now = Date.now();
        
        // Debounce: só enviar se passou pelo menos 20 segundos desde o último ping
        if (now - lastPingTime < 20000) {
          console.log('⏱️ [ApiService] Ping muito recente, pulando...');
          return;
        }
        
        lastPingTime = now;
        console.log('🏝 [ApiService] Enviando ping para manter conexão');
        this.socket.emit('ping', { 
          timestamp: now,
          userType: this.userType,
          userId: this.userId 
        });
      } else {
        console.warn('⚠️ [ApiService] Socket desconectado durante heartbeat - tentando reconectar');
        this.clearHeartbeat();
        
        // Tentar reconexão automática
        if (this.userType && this.userId) {
          console.log('🔄 [ApiService] Iniciando reconexão automática...');
          setTimeout(() => {
            this.autoReconnect();
          }, 2000);
        }
      }
    }, 25000); // 25 segundos para evitar sobrecarga de rede
    
    // Listener para resposta pong com timeout de detecção
    if (this.socket) {
      this.socket.on('pong', (data) => {
        const latency = Date.now() - (data.timestamp || 0);
        console.log(`🏓 [ApiService] Pong recebido - Latência: ${latency}ms`);
        
        // Se latência muito alta, avisar
        if (latency > 5000) {
          console.warn(`⚠️ [ApiService] Latência alta detectada: ${latency}ms - conexão pode estar instável`);
        }
      });
      
      // Detector de desconexão silenciosa
      this.connectionCheckInterval = setInterval(() => {
        if (this.socket && !this.socket.connected && this.isConnected) {
          console.error('🚨 [ApiService] Desconexão silenciosa detectada!');
          this.isConnected = false;
          this.autoReconnect();
        }
      }, 10000); // Verificar a cada 10 segundos
    }
  }
  
  // Limpar heartbeat
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      console.log('🗑️ [ApiService] Limpando heartbeat interval');
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionCheckInterval) {
      console.log('🗑️ [ApiService] Limpando connection check interval');
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }
  
  // Reconectar automaticamente
  async autoReconnect() {
    if (this.isConnected || !this.userType || !this.userId || this.isReconnecting) {
      return;
    }
    
    this.isReconnecting = true;
    console.log('🔄 [ApiService] Tentando reconexão automática...');
    
    // Limpar recursos existentes
    this.clearHeartbeat();
    
    try {
      // Aguardar um pouco antes de tentar reconectar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar conectividade da API primeiro
      const apiTest = await this.testApiConnection();
      if (!apiTest.success) {
        console.error('❌ [ApiService] API não está disponível para reconexão:', apiTest.error);
        this.isReconnecting = false;
        
        // Tentar novamente em 10 segundos
        setTimeout(() => {
          this.autoReconnect();
        }, 10000);
        return;
      }
      
      console.log('✅ [ApiService] API disponível, reconectando WebSocket...');
      
      // Tentar reconectar
      const socket = this.connectSocket(this.userType, this.userId);
      
      if (socket) {
        console.log('✅ [ApiService] Reconexão bem-sucedida!');
      } else {
        console.error('❌ [ApiService] Falha na reconexão');
        
        // Tentar novamente em 5 segundos
        setTimeout(() => {
          this.autoReconnect();
        }, 5000);
      }
      
    } catch (error) {
      console.error('❌ [ApiService] Erro na reconexão automática:', error);
      
      // Tentar novamente em 5 segundos
      setTimeout(() => {
        this.autoReconnect();
      }, 5000);
    } finally {
      this.isReconnecting = false;
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
    console.log('🔵 [apiService.acceptRide] INICIANDO aceitação de corrida');
    console.log('🔵 [apiService.acceptRide] Parâmetros:', {
      rideId,
      driverData,
      url: `${API_BASE_URL}/rides/${rideId}/accept`
    });
    
    try {
      console.log('🔵 [apiService.acceptRide] Fazendo requisição HTTP...');
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      console.log('🔵 [apiService.acceptRide] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('🔵 [apiService.acceptRide] Dados da resposta:', data);
      
      if (!response.ok) {
        console.error('🔴 [apiService.acceptRide] Resposta não OK:', {
          status: response.status,
          data
        });
        throw new Error(data.message || 'Erro ao aceitar corrida');
      }

      console.log('✅ [apiService.acceptRide] Corrida aceita com sucesso:', data);
      
      // Emitir evento manualmente se o socket estiver conectado
      if (this.socket && this.socket.connected) {
        console.log('📡 [apiService.acceptRide] Emitindo evento ride_accepted via socket...');
        this.socket.emit('ride_accepted', {
          rideId,
          driverData,
          ride: data.ride || data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error('❌ [apiService.acceptRide] ERRO COMPLETO:', error);
      console.error('❌ [apiService.acceptRide] Stack trace:', error.stack);
      console.error('❌ [apiService.acceptRide] Tipo de erro:', error.name);
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
      
     
      return data;
    } catch (error) {
      //console.error('❌ Erro ao atualizar localização:', error);
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
      //console.error('❌ Erro ao registrar motorista:', error);
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
      //console.error('❌ Erro ao atualizar status:', error);
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
       console.log('🧪 [TESTE] Testando notificação ride_accepted...');
       
       const testData = {
         test: true, // Flag para identificar teste
         rideId: rideId || 'test-ride-123',
         ride: {
           id: rideId || 'test-ride-123',
           passengerId: passengerId || 'test-passenger-123',
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
         estimatedArrival: '3-5 minutos',
         timestamp: new Date().toISOString()
       };
       
       // Simular recebimento do evento
       console.log('📤 [TESTE] Simulando recebimento de ride_accepted...');
       this.triggerCallbacks('ride_accepted', testData);
       
       console.log('📤 [TESTE] Evento de teste executado:', testData);
       return testData;
       
     } else {
       console.error('❌ [TESTE] Socket não está conectado para teste');
       return null;
     }
   }
   
   // Ferramenta de teste abrangente para todos os eventos
   testAllRideEvents(rideId = 'test-ride-123', passengerId = 'test-passenger-123') {
     if (!this.socket || !this.socket.connected) {
       console.error('❌ [TESTE] Socket não conectado');
       return false;
     }
     
     console.log('🧪 [TESTE COMPLETO] Iniciando teste de todos os eventos...');
     
     const baseRideData = {
       rideId,
       ride: {
         id: rideId,
         passengerId,
         status: 'pending'
       },
       timestamp: new Date().toISOString(),
       test: true
     };
     
     const tests = [
       {
         event: 'ride_accepted',
         data: {
           ...baseRideData,
           driver: {
             id: 'test-driver-123',
             name: 'Motorista Teste',
             phone: '+244 900 000 000'
           },
           estimatedArrival: '5-10 minutos'
         }
       },
       {
         event: 'ride_rejected',
         data: {
           ...baseRideData,
           reason: 'Teste de rejeição'
         }
       },
       {
         event: 'ride_started',
         data: {
           ...baseRideData,
           ride: { ...baseRideData.ride, status: 'started' },
           message: 'Corrida iniciada - TESTE'
         }
       },
       {
         event: 'ride_completed',
         data: {
           ...baseRideData,
           ride: { ...baseRideData.ride, status: 'completed' },
           fare: 500
         }
       },
       {
         event: 'ride_cancelled',
         data: {
           ...baseRideData,
           cancelledBy: 'driver',
           reason: 'Teste de cancelamento'
         }
       },
       {
         event: 'no_drivers_available',
         data: {
           ...baseRideData,
           message: 'Nenhum motorista disponível - TESTE'
         }
       }
     ];
     
     let testIndex = 0;
     const runNextTest = () => {
       if (testIndex >= tests.length) {
         console.log('✅ [TESTE COMPLETO] Todos os testes foram executados!');
         return;
       }
       
       const test = tests[testIndex];
       console.log(`🧪 [TESTE ${testIndex + 1}/${tests.length}] Testando evento: ${test.event}`);
       
       this.triggerCallbacks(test.event, test.data);
       
       testIndex++;
       
       // Executar próximo teste após 2 segundos
       setTimeout(runNextTest, 2000);
     };
     
     runNextTest();
     return true;
   }
   
   // Diagnóstico do estado dos callbacks
   diagnoseCallbacks() {
     console.log('🔍 [DIAGNÓSTICO] Estado dos callbacks:');
     console.log(`📊 Total de eventos registrados: ${this.eventCallbacks.size}`);
     
     if (this.eventCallbacks.size === 0) {
       console.warn('⚠️ [DIAGNÓSTICO] NENHUM callback registrado!');
       return false;
     }
     
     for (const [eventName, callbacks] of this.eventCallbacks.entries()) {
       console.log(`  📦 ${eventName}: ${callbacks.length} callback(s)`);
       
       callbacks.forEach((callback, index) => {
         console.log(`    - Callback ${index + 1}: ${typeof callback}`);
       });
     }
     
     // Verificar estado do socket
     console.log('🔌 [DIAGNÓSTICO] Estado do Socket:');
     console.log(`  Conectado: ${this.socket?.connected || false}`);
     console.log(`  Socket ID: ${this.socket?.id || 'N/A'}`);
     console.log(`  UserType: ${this.userType || 'N/A'}`);
     console.log(`  UserID: ${this.userId || 'N/A'}`);
     
     return true;
   }

  // Calcular preço estimado da corrida
  calculateEstimatedFare(distance, time, vehicleType = 'standard') {
    if (vehicleType === 'coletivo' || vehicleType === 'standard') {
      // Coletivo: preço fixo de 500 AOA
      return 500;
    } else if (vehicleType === 'privado' || vehicleType === 'premium') {
      // Privado: a partir de 2500 AOA + cálculo por distância aumentado
      const baseFare = 2500; // Taxa base mínima em AOA (aumentado de 1200)
      const perKmRate = 300; // AOA por km para privado (aumentado de 150)
      const perMinuteRate = 50; // AOA por minuto para privado (aumentado de 25)
      
      const distanceFare = distance * perKmRate;
      const timeFare = time * perMinuteRate;
      
      const calculatedFare = Math.round(baseFare + distanceFare + timeFare);
      
      // Garantir que o preço mínimo seja 2500 AOA
      return Math.max(calculatedFare, 2500);
    }
    
    // Fallback para standard
    return 500;
  }

  // Obter detalhes de uma corrida específica
  async getRide(rideId) {
    try {
      console.log(`📡 [API] Buscando detalhes da corrida ${rideId}`);
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ [API] Dados da corrida obtidos:', data);
        
        // DEBUG DETALHADO: Verificar estrutura dos dados
        console.log('🔍 [API DEBUG] Estrutura detalhada dos dados:');
        console.log('📊 [API DEBUG] data.success:', data.success);
        console.log('📊 [API DEBUG] data.data exists:', !!data.data);
        if (data.data) {
          console.log('📊 [API DEBUG] data.data.id:', data.data.id);
          console.log('📊 [API DEBUG] data.data.status:', data.data.status);
          console.log('📊 [API DEBUG] data.data.passengerId:', data.data.passengerId);
          console.log('📊 [API DEBUG] data.data.driverId:', data.data.driverId);
          console.log('📊 [API DEBUG] data.data keys:', Object.keys(data.data));
        }
        
        return { success: true, data };
      } else {
        console.error('❌ [API] Erro ao obter corrida:', data.error);
        return { success: false, error: data.error || 'Erro ao obter dados da corrida' };
      }
    } catch (error) {
      console.error('❌ [API] Erro de rede ao obter corrida:', error);
      return { success: false, error: error.message };
    }
  }

  // Implementar fallback via polling para status de corrida
  startRideStatusPolling(rideId, onStatusUpdate, intervalMs = 2000, maxDuration = 60000) {
    console.log(`🔄 [POLLING] Iniciando polling para corrida ${rideId}`);
    
    let pollCount = 0;
    const startTime = Date.now();
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`🔍 [POLLING] Verificando status da corrida ${rideId} (tentativa ${pollCount})`);
        
        // Verificar se deve parar o polling
        if (Date.now() - startTime > maxDuration) {
          console.log(`⏰ [POLLING] Tempo máximo atingido, parando polling`);
          clearInterval(pollInterval);
          return;
        }
        
        // Buscar status da corrida
        const response = await this.getRide(rideId);
        
        if (response.success && response.data) {
          // CORREÇÃO: Extrair corretamente a corrida dos dados
          const ride = response.data.data || response.data; // Pode estar em data.data ou diretamente em data
          
          console.log('🔍 [POLLING DEBUG] Ride extraído:', ride);
          console.log('🔍 [POLLING DEBUG] Status da corrida:', ride.status);
          
          // Chamar callback com atualização de status
          if (onStatusUpdate) {
            onStatusUpdate(ride);
          }
          
          // Parar polling se corrida foi aceita, completada ou cancelada
          if (['accepted', 'in_progress', 'completed', 'cancelled'].includes(ride.status)) {
            console.log(`✅ [POLLING] Status final detectado: ${ride.status}, parando polling`);
            clearInterval(pollInterval);
          }
        }
        
      } catch (error) {
        console.error(`❌ [POLLING] Erro ao verificar status:`, error);
      }
    }, intervalMs);
    
    // Retornar função para parar o polling manualmente
    return () => {
      console.log(`🛑 [POLLING] Parando polling manualmente para corrida ${rideId}`);
      clearInterval(pollInterval);
    };
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