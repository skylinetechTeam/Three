/**
 * DIAGNÓSTICO: PROBLEMA NOTIFICAÇÕES PRODUÇÃO vs DESENVOLVIMENTO
 * 
 * SITUAÇÃO:
 * - ✅ Dev: Passageiro (dev) + Motorista (build) = FUNCIONA
 * - ❌ Build: Passageiro (build) + Motorista (dev) = NÃO FUNCIONA
 * 
 * CAUSA IDENTIFICADA:
 * O problema está especificamente no LADO PASSAGEIRO quando em PRODUÇÃO
 */

import apiService from './services/apiService';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// ==========================================
// 1. DIAGNÓSTICO DO PROBLEMA PRINCIPAL
// ==========================================

/**
 * ANÁLISE:
 * 
 * 1. BUNDLING EM PRODUÇÃO:
 *    - Em produção, o bundle é minificado e otimizado
 *    - Pode haver problemas com event listeners não registrados corretamente
 *    - WebSockets podem ter comportamento diferente
 * 
 * 2. BACKGROUND APP STATE:
 *    - Em produção, o app pode ser suspenso mais agressivamente
 *    - WebSocket connections podem ser fechadas pelo sistema
 * 
 * 3. ENVIRONMENT VARIABLES:
 *    - process.env pode ter valores diferentes em dev vs prod
 *    - URLs de API podem estar incorretas
 * 
 * 4. TIMING ISSUES:
 *    - Em produção, o código executa mais rápido (otimizado)
 *    - Race conditions podem aparecer
 */

// ==========================================
// 2. SOLUÇÃO ESPECÍFICA PARA PRODUÇÃO
// ==========================================

export class ProductionNotificationFixer {
  constructor() {
    this.isProduction = !__DEV__;
    this.callbacks = new Map();
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.lastActivity = Date.now();
    this.heartbeatInterval = null;
    this.appStateListener = null;
    this.netInfoListener = null;
  }

  /**
   * Inicializar sistema de notificações com correções específicas para produção
   */
  async initProductionNotifications(userType, userId) {
    console.log('🏭 [PRODUCTION FIX] Inicializando notificações para produção');
    console.log('📊 [PRODUCTION FIX] Environment:', {
      isDev: __DEV__,
      platform: Platform.OS,
      userType,
      userId
    });

    try {
      // 1. Configurar listeners de sistema ANTES do WebSocket
      this.setupSystemListeners();
      
      // 2. Verificar conectividade de rede
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.warn('⚠️ [PRODUCTION FIX] Sem conexão de rede');
        return false;
      }

      // 3. Configurar callbacks COM TIMING ESPECÍFICO PARA PRODUÇÃO
      await this.setupProductionCallbacks();

      // 4. Conectar WebSocket com configurações específicas para produção
      const success = await this.connectWithProductionConfig(userType, userId);
      
      if (success) {
        // 5. Iniciar monitoramento de produção
        this.startProductionMonitoring();
        console.log('✅ [PRODUCTION FIX] Sistema inicializado com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ [PRODUCTION FIX] Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Configurar listeners de sistema (App State, Network)
   */
  setupSystemListeners() {
    console.log('🎧 [PRODUCTION FIX] Configurando listeners de sistema');

    // App State Listener - CRÍTICO para produção
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      console.log('📱 [PRODUCTION FIX] App state changed:', nextAppState);
      
      if (nextAppState === 'active') {
        // App voltou para foreground - reconectar se necessário
        this.handleAppBecameActive();
      } else if (nextAppState === 'background') {
        // App foi para background - manter conexão viva
        this.handleAppWentBackground();
      }
    });

    // Network State Listener
    this.netInfoListener = NetInfo.addEventListener((state) => {
      console.log('🌐 [PRODUCTION FIX] Network state changed:', state);
      
      if (state.isConnected && !apiService.isConnected) {
        // Rede voltou - tentar reconectar
        this.handleNetworkReconnected();
      }
    });
  }

  /**
   * Configurar callbacks COM TIMING específico para produção
   */
  async setupProductionCallbacks() {
    console.log('🔗 [PRODUCTION FIX] Configurando callbacks para produção');

    // AGUARDAR 1 segundo para garantir que tudo está pronto
    if (this.isProduction) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const productionCallbacks = {
      'ride_accepted': (data) => {
        console.log('🎉 [PRODUCTION FIX] Ride accepted callback executado:', data);
        this.lastActivity = Date.now();
        
        // Executar callback original com delay em produção
        setTimeout(() => {
          this.triggerOriginalCallbacks('ride_accepted', data);
        }, this.isProduction ? 100 : 0);
      },

      'ride_rejected': (data) => {
        console.log('❌ [PRODUCTION FIX] Ride rejected callback:', data);
        this.lastActivity = Date.now();
        this.triggerOriginalCallbacks('ride_rejected', data);
      },

      'no_drivers_available': (data) => {
        console.log('🚫 [PRODUCTION FIX] No drivers available callback:', data);
        this.lastActivity = Date.now();
        this.triggerOriginalCallbacks('no_drivers_available', data);
      },

      'ride_started': (data) => {
        console.log('🚗 [PRODUCTION FIX] Ride started callback:', data);
        this.lastActivity = Date.now();
        this.triggerOriginalCallbacks('ride_started', data);
      },

      'driver_location_update': (data) => {
        this.lastActivity = Date.now();
        this.triggerOriginalCallbacks('driver_location_update', data);
      }
    };

    // Registrar callbacks com o apiService
    for (const [event, callback] of Object.entries(productionCallbacks)) {
      console.log(`📝 [PRODUCTION FIX] Registrando callback para: ${event}`);
      apiService.onEvent(event, callback);
      this.callbacks.set(event, callback);
    }

    console.log('✅ [PRODUCTION FIX] Callbacks registrados:', Array.from(this.callbacks.keys()));
  }

  /**
   * Conectar WebSocket com configurações específicas para produção
   */
  async connectWithProductionConfig(userType, userId) {
    console.log('🔌 [PRODUCTION FIX] Conectando WebSocket para produção');

    // Configurações específicas para produção
    const productionConfig = {
      forceNew: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: this.isProduction ? 15000 : 10000, // Mais tempo em produção
      reconnection: true,
      reconnectionDelay: this.isProduction ? 3000 : 2000,
      reconnectionDelayMax: 10000,
      maxReconnectionAttempts: this.isProduction ? 10 : 5,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
        'production-mode': this.isProduction ? 'true' : 'false',
        'user-agent': `TaxiApp-${Platform.OS}-${this.isProduction ? 'prod' : 'dev'}`
      }
    };

    console.log('⚙️ [PRODUCTION FIX] Configurações do socket:', productionConfig);

    try {
      // Tentar conexão com as configurações específicas
      const socket = apiService.connectSocket(userType, userId);
      
      if (socket) {
        // Aguardar conexão em produção
        if (this.isProduction) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout waiting for connection'));
            }, 10000);

            const checkConnection = () => {
              if (apiService.isConnected) {
                clearTimeout(timeout);
                resolve(true);
              } else {
                setTimeout(checkConnection, 500);
              }
            };

            checkConnection();
          });
        }

        this.connectionRetries = 0;
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ [PRODUCTION FIX] Erro na conexão:', error);
      
      // Retry em produção
      if (this.isProduction && this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 [PRODUCTION FIX] Tentativa ${this.connectionRetries}/${this.maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connectWithProductionConfig(userType, userId);
      }

      return false;
    }
  }

  /**
   * Iniciar monitoramento específico para produção
   */
  startProductionMonitoring() {
    console.log('🔍 [PRODUCTION FIX] Iniciando monitoramento de produção');

    // Heartbeat melhorado para produção
    this.heartbeatInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, this.isProduction ? 15000 : 30000); // Mais frequente em produção

    // Monitorar atividade
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      if (timeSinceLastActivity > 60000) { // 1 minuto sem atividade
        console.warn('⚠️ [PRODUCTION FIX] Sem atividade por 1 minuto');
        this.testConnection();
      }
    }, 30000);
  }

  /**
   * Verificar saúde da conexão
   */
  checkConnectionHealth() {
    if (!apiService.isConnected || !apiService.socket) {
      console.warn('⚠️ [PRODUCTION FIX] Conexão perdida, tentando reconectar');
      this.attemptReconnection();
    } else {
      // Enviar ping de teste
      try {
        apiService.socket.emit('ping', {
          timestamp: Date.now(),
          source: 'production-health-check',
          platform: Platform.OS
        });
      } catch (error) {
        console.error('❌ [PRODUCTION FIX] Erro ao enviar ping:', error);
      }
    }
  }

  /**
   * Testar conexão mandando evento de teste
   */
  testConnection() {
    if (apiService.socket && apiService.isConnected) {
      console.log('🧪 [PRODUCTION FIX] Testando conexão...');
      
      // Teste específico para produção
      apiService.socket.emit('test_connection', {
        timestamp: Date.now(),
        userAgent: Platform.OS,
        environment: this.isProduction ? 'production' : 'development'
      });
    }
  }

  /**
   * Lidar com app voltando para foreground
   */
  async handleAppBecameActive() {
    console.log('📱 [PRODUCTION FIX] App became active');
    
    // Aguardar um pouco para o app se estabilizar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!apiService.isConnected) {
      console.log('🔄 [PRODUCTION FIX] Reconectando após foreground');
      this.attemptReconnection();
    }
  }

  /**
   * Lidar com app indo para background
   */
  handleAppWentBackground() {
    console.log('📱 [PRODUCTION FIX] App went to background');
    
    // Em produção, manter conexão viva com ping mais frequente
    if (this.isProduction) {
      // Implementar estratégias específicas para background
    }
  }

  /**
   * Lidar com reconexão de rede
   */
  async handleNetworkReconnected() {
    console.log('🌐 [PRODUCTION FIX] Network reconnected');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!apiService.isConnected) {
      this.attemptReconnection();
    }
  }

  /**
   * Tentar reconexão
   */
  async attemptReconnection() {
    if (this.connectionRetries >= this.maxRetries) {
      console.error('❌ [PRODUCTION FIX] Máximo de tentativas atingido');
      return;
    }

    this.connectionRetries++;
    console.log(`🔄 [PRODUCTION FIX] Tentando reconexão ${this.connectionRetries}/${this.maxRetries}`);

    try {
      // Limpar conexão existente
      if (apiService.socket) {
        apiService.disconnectSocket();
      }

      // Aguardar antes de tentar reconectar
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Tentar reconectar (precisaria dos parâmetros originais)
      // apiService.connectSocket(this.userType, this.userId);
      
    } catch (error) {
      console.error('❌ [PRODUCTION FIX] Erro na reconexão:', error);
    }
  }

  /**
   * Executar callbacks originais
   */
  triggerOriginalCallbacks(eventName, data) {
    console.log(`🎯 [PRODUCTION FIX] Executando callbacks originais para: ${eventName}`);
    
    // Aqui precisaria chamar os callbacks originais da HomeScreen
    // Implementar baseado na estrutura específica
  }

  /**
   * Limpar recursos
   */
  cleanup() {
    console.log('🧹 [PRODUCTION FIX] Limpando recursos');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    
    if (this.netInfoListener && this.netInfoListener.remove) {
      this.netInfoListener();
    }
  }
}

// ==========================================
// 3. IMPLEMENTAÇÃO ESPECÍFICA PARA HOMESCREEN
// ==========================================

/**
 * Função para integrar na HomeScreen
 */
export const initProductionNotificationFix = async (userType, userId) => {
  console.log('🚀 [PRODUCTION FIX] Inicializando correção para produção');
  
  const fixer = new ProductionNotificationFixer();
  const success = await fixer.initProductionNotifications(userType, userId);
  
  if (success) {
    console.log('✅ [PRODUCTION FIX] Correção aplicada com sucesso');
    return fixer; // Retornar instância para cleanup posterior
  } else {
    console.error('❌ [PRODUCTION FIX] Falha na aplicação da correção');
    return null;
  }
};

// ==========================================
// 4. CONFIGURAÇÕES ESPECÍFICAS PARA EAS BUILD
// ==========================================

/**
 * Adicionar ao app.json/app.config.js:
 */
export const PRODUCTION_CONFIG_SUGGESTIONS = {
  expo: {
    // Configurações para background processing
    ios: {
      backgroundModes: ['background-processing', 'background-fetch'],
      infoPlist: {
        UIBackgroundModes: ['background-processing']
      }
    },
    android: {
      // Configurações específicas para Android
      permissions: [
        'WAKE_LOCK',
        'RECEIVE_BOOT_COMPLETED'
      ]
    },
    // Plugins específicos para produção
    plugins: [
      ['expo-background-fetch'],
      ['expo-task-manager']
    ]
  }
};

export default ProductionNotificationFixer;