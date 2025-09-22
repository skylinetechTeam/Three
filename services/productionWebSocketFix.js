/**
 * 🔧 CORREÇÃO IMEDIATA: WEBSOCKET PRODUÇÃO vs DESENVOLVIMENTO
 * 
 * PROBLEMA IDENTIFICADO:
 * - Passageiro (dev) + Motorista (build) = ✅ FUNCIONA  
 * - Passageiro (build) + Motorista (dev) = ❌ NÃO FUNCIONA
 * 
 * CAUSA: Timing e diferenças de bundling em produção no lado passageiro
 */

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ProductionWebSocketFix {
  constructor(apiService) {
    this.apiService = apiService;
    this.isProduction = !__DEV__;
    this.userType = null;
    this.userId = null;
    this.originalCallbacks = new Map();
    this.productionCallbacks = new Map();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.lastConnectionTime = null;
    this.appStateSubscription = null;
    this.connectionHealthTimer = null;
  }

  /**
   * 🚀 MÉTODO PRINCIPAL: Aplicar correção para produção
   */
  async applyProductionFix(userType, userId, originalCallbacks = {}) {
    console.log('🏭 [PROD FIX] Aplicando correção específica para produção');
    console.log('📊 [PROD FIX] Ambiente:', {
      isDev: __DEV__,
      platform: Platform.OS,
      userType,
      userId
    });

    this.userType = userType;
    this.userId = userId;

    try {
      // 1. Salvar callbacks originais
      this.saveOriginalCallbacks(originalCallbacks);

      // 2. Aplicar configurações específicas para produção
      if (this.isProduction) {
        await this.applyProductionConfigurations();
      }

      // 3. Configurar callbacks com wrapper de produção
      this.setupProductionCallbacks();

      // 4. Conectar com configurações específicas
      const connected = await this.connectWithProductionSettings();

      if (connected) {
        // 5. Iniciar monitoramento
        this.startProductionMonitoring();
        console.log('✅ [PROD FIX] Correção aplicada com sucesso');
        return true;
      }

      console.error('❌ [PROD FIX] Falha na conexão');
      return false;

    } catch (error) {
      console.error('❌ [PROD FIX] Erro na aplicação da correção:', error);
      return false;
    }
  }

  /**
   * 💾 Salvar callbacks originais para execução posterior
   */
  saveOriginalCallbacks(callbacks) {
    console.log('💾 [PROD FIX] Salvando callbacks originais');
    
    this.originalCallbacks.clear();
    for (const [event, callback] of Object.entries(callbacks)) {
      this.originalCallbacks.set(event, callback);
      console.log(`📝 [PROD FIX] Callback salvo: ${event}`);
    }
  }

  /**
   * ⚙️ Aplicar configurações específicas para produção
   */
  async applyProductionConfigurations() {
    console.log('⚙️ [PROD FIX] Aplicando configurações de produção');

    // Configurar timeout maior em produção
    if (this.apiService.socket) {
      this.apiService.socket.timeout = 15000; // 15 segundos
    }

    // Salvar estado no AsyncStorage para persistência
    await AsyncStorage.setItem('production_websocket_config', JSON.stringify({
      userType: this.userType,
      userId: this.userId,
      timestamp: Date.now(),
      platform: Platform.OS
    }));

    // Configurar listener de App State ANTES da conexão
    this.setupAppStateListener();
  }

  /**
   * 📱 Configurar listener de estado do app
   */
  setupAppStateListener() {
    console.log('📱 [PROD FIX] Configurando listener de App State');

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 [PROD FIX] App State mudou:', nextAppState);

      if (nextAppState === 'active' && this.lastConnectionTime) {
        const timeSinceLastConnection = Date.now() - this.lastConnectionTime;
        
        // Se passou mais de 30 segundos desde a última conexão
        if (timeSinceLastConnection > 30000) {
          console.log('🔄 [PROD FIX] App reativado, verificando conexão');
          this.checkAndReconnect();
        }
      }
    });
  }

  /**
   * 🔗 Configurar callbacks com wrapper específico para produção
   */
  setupProductionCallbacks() {
    console.log('🔗 [PROD FIX] Configurando callbacks com wrapper de produção');

    // Limpar callbacks existentes no apiService
    if (this.apiService.eventCallbacks) {
      console.log('🧹 [PROD FIX] Limpando callbacks existentes');
      this.apiService.eventCallbacks.clear();
    }

    // Criar wrappers para cada evento importante
    const eventsToWrap = [
      'ride_accepted',
      'ride_rejected', 
      'no_drivers_available',
      'ride_started',
      'ride_completed',
      'ride_cancelled',
      'driver_location_update'
    ];

    eventsToWrap.forEach(eventName => {
      const wrappedCallback = this.createProductionWrapper(eventName);
      
      // Registrar no apiService
      this.apiService.onEvent(eventName, wrappedCallback);
      this.productionCallbacks.set(eventName, wrappedCallback);
      
      console.log(`✅ [PROD FIX] Wrapper criado para: ${eventName}`);
    });
  }

  /**
   * 🎁 Criar wrapper específico para produção
   */
  createProductionWrapper(eventName) {
    return (data) => {
      console.log(`🎉 [PROD FIX] Evento recebido: ${eventName}`, data);
      
      try {
        // Em produção, adicionar pequeno delay para garantir estabilidade
        const delay = this.isProduction ? 100 : 0;
        
        setTimeout(() => {
          // Executar callback original se existir
          const originalCallback = this.originalCallbacks.get(eventName);
          if (originalCallback && typeof originalCallback === 'function') {
            console.log(`🎯 [PROD FIX] Executando callback original: ${eventName}`);
            originalCallback(data);
          } else {
            console.warn(`⚠️ [PROD FIX] Callback original não encontrado: ${eventName}`);
          }

          // Atualizar timestamp da última atividade
          this.lastConnectionTime = Date.now();

        }, delay);

      } catch (error) {
        console.error(`❌ [PROD FIX] Erro no wrapper ${eventName}:`, error);
      }
    };
  }

  /**
   * 🔌 Conectar com configurações específicas para produção
   */
  async connectWithProductionSettings() {
    console.log('🔌 [PROD FIX] Conectando com configurações de produção');
    
    try {
      // Aguardar um pouco em produção para garantir que tudo está pronto
      if (this.isProduction) {
        console.log('⏰ [PROD FIX] Aguardando 1.5s para estabilizar...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Tentar conexão
      const socket = this.apiService.connectSocket(this.userType, this.userId);
      
      if (!socket) {
        console.error('❌ [PROD FIX] Falha ao obter socket');
        return false;
      }

      // Em produção, aguardar confirmação de conexão
      if (this.isProduction) {
        const connected = await this.waitForConnection(10000); // 10 segundos
        if (connected) {
          this.lastConnectionTime = Date.now();
          this.connectionAttempts = 0;
          console.log('✅ [PROD FIX] Conexão confirmada');
          return true;
        } else {
          console.error('❌ [PROD FIX] Timeout aguardando conexão');
          return this.retryConnection();
        }
      }

      return true;

    } catch (error) {
      console.error('❌ [PROD FIX] Erro na conexão:', error);
      return this.retryConnection();
    }
  }

  /**
   * ⏰ Aguardar conexão ser estabelecida
   */
  async waitForConnection(timeout = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (this.apiService.isConnected) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkConnection, 500);
        }
      };
      
      checkConnection();
    });
  }

  /**
   * 🔄 Tentar reconexão
   */
  async retryConnection() {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error('❌ [PROD FIX] Máximo de tentativas atingido');
      return false;
    }

    this.connectionAttempts++;
    console.log(`🔄 [PROD FIX] Tentativa ${this.connectionAttempts}/${this.maxConnectionAttempts}`);

    // Aguardar antes de tentar novamente
    await new Promise(resolve => setTimeout(resolve, 2000 * this.connectionAttempts));

    return this.connectWithProductionSettings();
  }

  /**
   * 🔍 Iniciar monitoramento específico para produção
   */
  startProductionMonitoring() {
    console.log('🔍 [PROD FIX] Iniciando monitoramento de produção');

    // Verificar saúde da conexão a cada 20 segundos em produção
    const healthCheckInterval = this.isProduction ? 20000 : 30000;
    
    this.connectionHealthTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, healthCheckInterval);

    // Log periódico do estado
    setInterval(() => {
      console.log('📊 [PROD FIX] Estado:', {
        connected: this.apiService.isConnected,
        socketExists: !!this.apiService.socket,
        lastActivity: this.lastConnectionTime ? Date.now() - this.lastConnectionTime : 'never',
        callbacksRegistered: this.productionCallbacks.size
      });
    }, 60000); // A cada 1 minuto
  }

  /**
   * 🏥 Verificar saúde da conexão
   */
  checkConnectionHealth() {
    if (!this.apiService.isConnected || !this.apiService.socket) {
      console.warn('⚠️ [PROD FIX] Conexão perdida, tentando reconectar');
      this.checkAndReconnect();
    } else {
      // Enviar ping para manter conexão viva
      try {
        this.apiService.socket.emit('ping', {
          timestamp: Date.now(),
          source: 'production-health-check',
          userType: this.userType
        });
        console.log('🏓 [PROD FIX] Ping enviado');
      } catch (error) {
        console.error('❌ [PROD FIX] Erro ao enviar ping:', error);
      }
    }
  }

  /**
   * 🔄 Verificar e reconectar se necessário
   */
  async checkAndReconnect() {
    console.log('🔄 [PROD FIX] Verificando necessidade de reconexão');
    
    if (this.apiService.isConnected) {
      console.log('✅ [PROD FIX] Conexão OK, não precisa reconectar');
      return;
    }

    console.log('🔌 [PROD FIX] Tentando reconectar...');

    try {
      // Limpar conexão anterior
      if (this.apiService.socket) {
        this.apiService.disconnectSocket();
      }

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Tentar reconectar
      const reconnected = await this.connectWithProductionSettings();
      
      if (reconnected) {
        console.log('✅ [PROD FIX] Reconexão bem-sucedida');
      } else {
        console.error('❌ [PROD FIX] Falha na reconexão');
      }

    } catch (error) {
      console.error('❌ [PROD FIX] Erro na reconexão:', error);
    }
  }

  /**
   * 🧪 Testar sistema de notificações
   */
  testNotificationSystem() {
    console.log('🧪 [PROD FIX] Testando sistema de notificações');
    
    if (!this.apiService.socket || !this.apiService.isConnected) {
      console.error('❌ [PROD FIX] Socket não conectado para teste');
      return false;
    }

    // Testar cada callback
    const testEvents = [
      'ride_accepted',
      'ride_rejected',
      'no_drivers_available'
    ];

    testEvents.forEach(eventName => {
      console.log(`🧪 [PROD FIX] Testando evento: ${eventName}`);
      
      const testData = {
        test: true,
        event: eventName,
        timestamp: Date.now(),
        source: 'production-test'
      };

      // Disparar callback diretamente
      if (this.productionCallbacks.has(eventName)) {
        this.productionCallbacks.get(eventName)(testData);
      }
    });

    return true;
  }

  /**
   * 🧹 Limpar recursos
   */
  cleanup() {
    console.log('🧹 [PROD FIX] Limpando recursos');

    if (this.connectionHealthTimer) {
      clearInterval(this.connectionHealthTimer);
      this.connectionHealthTimer = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.productionCallbacks.clear();
    this.originalCallbacks.clear();
  }
}

// ==========================================
// FUNÇÃO DE INTEGRAÇÃO PARA HOMESCREEN
// ==========================================

/**
 * 🎯 Função principal para integrar na HomeScreen
 */
export async function applyProductionWebSocketFix(apiService, userType, userId, callbacks) {
  console.log('🚀 [PROD FIX] Iniciando aplicação da correção');
  
  const fix = new ProductionWebSocketFix(apiService);
  const success = await fix.applyProductionFix(userType, userId, callbacks);
  
  if (success) {
    console.log('✅ [PROD FIX] Correção aplicada com sucesso');
    
    // Retornar instância para controle posterior
    return {
      fix,
      test: () => fix.testNotificationSystem(),
      cleanup: () => fix.cleanup(),
      reconnect: () => fix.checkAndReconnect()
    };
  } else {
    console.error('❌ [PROD FIX] Falha na aplicação da correção');
    return null;
  }
}

export default ProductionWebSocketFix;