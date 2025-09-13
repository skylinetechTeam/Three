/**
 * Sistema Centralizado de Logs e Debugging para Correção do Sistema de Feedback
 * 
 * Este módulo fornece funcionalidades avançadas de logging para monitorar:
 * - Conexões WebSocket
 * - Eventos de corrida 
 * - Problemas de callback
 * - Performance de notificações
 * - Validação de nomes de passageiros
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Níveis de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_CATEGORIES = {
  WEBSOCKET: 'websocket',
  RIDE_EVENTS: 'ride_events',
  PASSENGER_PROFILE: 'passenger_profile',
  MAP_VISUALIZATION: 'map_visualization',
  API_CALLS: 'api_calls',
  PERFORMANCE: 'performance',
  USER_INTERACTION: 'user_interaction'
};

class DebugLogger {
  constructor() {
    this.currentLevel = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    this.logs = [];
    this.maxLogs = 1000; // Manter apenas os últimos 1000 logs
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Contadores para métricas
    this.metrics = {
      websocketConnections: 0,
      websocketDisconnections: 0,
      rideEventsReceived: 0,
      callbacksExecuted: 0,
      callbacksFailures: 0,
      nameValidationCalls: 0,
      nameCorrections: 0
    };
    
    console.log(`🔍 [DebugLogger] Inicializado - Sessão: ${this.sessionId}`);
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log principal com formatação padronizada
   */
  log(level, category, message, data = null, context = null) {
    if (level > this.currentLevel) return;
    
    const timestamp = new Date().toISOString();
    const sessionTime = Date.now() - this.startTime;
    
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      sessionTime,
      level: Object.keys(LOG_LEVELS)[level],
      category,
      message,
      data,
      context,
      sessionId: this.sessionId
    };
    
    // Adicionar ao array de logs
    this.logs.push(logEntry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Log formatado no console
    const emoji = this.getEmojiForLevel(level);
    const levelName = Object.keys(LOG_LEVELS)[level];
    const categoryEmoji = this.getEmojiForCategory(category);
    
    let consoleMessage = `${emoji} [${levelName}] ${categoryEmoji} [${category.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(consoleMessage, data);
    } else {
      console.log(consoleMessage);
    }
    
    // Context adicional se fornecido
    if (context) {
      console.log(`   📋 Context:`, context);
    }
    
    // Salvar logs críticos no AsyncStorage
    if (level <= LOG_LEVELS.WARN) {
      this.saveCriticalLog(logEntry);
    }
  }
  
  getEmojiForLevel(level) {
    const emojis = ['🚨', '⚠️', 'ℹ️', '🔍', '🔬'];
    return emojis[level] || '📝';
  }
  
  getEmojiForCategory(category) {
    const emojis = {
      [LOG_CATEGORIES.WEBSOCKET]: '🔌',
      [LOG_CATEGORIES.RIDE_EVENTS]: '🚗',
      [LOG_CATEGORIES.PASSENGER_PROFILE]: '👤',
      [LOG_CATEGORIES.MAP_VISUALIZATION]: '🗺️',
      [LOG_CATEGORIES.API_CALLS]: '📡',
      [LOG_CATEGORIES.PERFORMANCE]: '⚡',
      [LOG_CATEGORIES.USER_INTERACTION]: '👆'
    };
    return emojis[category] || '📄';
  }
  
  // Métodos específicos por nível
  error(category, message, data, context) {
    this.log(LOG_LEVELS.ERROR, category, message, data, context);
  }
  
  warn(category, message, data, context) {
    this.log(LOG_LEVELS.WARN, category, message, data, context);
  }
  
  info(category, message, data, context) {
    this.log(LOG_LEVELS.INFO, category, message, data, context);
  }
  
  debug(category, message, data, context) {
    this.log(LOG_LEVELS.DEBUG, category, message, data, context);
  }
  
  trace(category, message, data, context) {
    this.log(LOG_LEVELS.TRACE, category, message, data, context);
  }
  
  // Métodos específicos para categorias críticas
  
  /**
   * Logs específicos para WebSocket
   */
  websocket = {
    connecting: (url, options) => {
      this.metrics.websocketConnections++;
      this.info(LOG_CATEGORIES.WEBSOCKET, 'Tentando conectar WebSocket', { url, options });
    },
    
    connected: (socketId, userType, userId) => {
      this.info(LOG_CATEGORIES.WEBSOCKET, 'WebSocket conectado com sucesso', {
        socketId,
        userType,
        userId,
        connectionNumber: this.metrics.websocketConnections
      });
    },
    
    disconnected: (reason, wasClean) => {
      this.metrics.websocketDisconnections++;
      this.warn(LOG_CATEGORIES.WEBSOCKET, 'WebSocket desconectado', {
        reason,
        wasClean,
        disconnectionNumber: this.metrics.websocketDisconnections
      });
    },
    
    error: (error, context) => {
      this.error(LOG_CATEGORIES.WEBSOCKET, 'Erro no WebSocket', { error: error.message, context });
    },
    
    eventReceived: (eventName, data) => {
      this.debug(LOG_CATEGORIES.WEBSOCKET, `Evento recebido: ${eventName}`, data);
    },
    
    eventSent: (eventName, data) => {
      this.debug(LOG_CATEGORIES.WEBSOCKET, `Evento enviado: ${eventName}`, data);
    }
  };
  
  /**
   * Logs específicos para eventos de corrida
   */
  rideEvents = {
    received: (eventName, data, processingTimeMs) => {
      this.metrics.rideEventsReceived++;
      this.info(LOG_CATEGORIES.RIDE_EVENTS, `Evento de corrida recebido: ${eventName}`, {
        data,
        processingTimeMs,
        totalEventsReceived: this.metrics.rideEventsReceived
      });
    },
    
    callbackExecuted: (eventName, callbackIndex, executionTimeMs) => {
      this.metrics.callbacksExecuted++;
      this.debug(LOG_CATEGORIES.RIDE_EVENTS, 'Callback executado', {
        eventName,
        callbackIndex,
        executionTimeMs,
        totalCallbacks: this.metrics.callbacksExecuted
      });
    },
    
    callbackFailed: (eventName, callbackIndex, error) => {
      this.metrics.callbacksFailures++;
      this.error(LOG_CATEGORIES.RIDE_EVENTS, 'Falha no callback', {
        eventName,
        callbackIndex,
        error: error.message,
        stack: error.stack,
        totalFailures: this.metrics.callbacksFailures
      });
    },
    
    noCallbacks: (eventName) => {
      this.warn(LOG_CATEGORIES.RIDE_EVENTS, 'Evento sem callbacks registrados', { eventName });
    }
  };
  
  /**
   * Logs específicos para perfil de passageiro
   */
  passengerProfile = {
    nameValidation: (originalName, safeName, wasDemo) => {
      this.metrics.nameValidationCalls++;
      if (wasDemo) this.metrics.nameCorrections++;
      
      this.debug(LOG_CATEGORIES.PASSENGER_PROFILE, 'Validação de nome executada', {
        originalName,
        safeName,
        wasDemo,
        corrected: originalName !== safeName,
        totalValidations: this.metrics.nameValidationCalls,
        totalCorrections: this.metrics.nameCorrections
      });
    },
    
    profileCreated: (profile, source) => {
      this.info(LOG_CATEGORIES.PASSENGER_PROFILE, 'Perfil de passageiro criado', {
        profile: { ...profile, email: profile.email ? '[REDACTED]' : null },
        source
      });
    },
    
    profileMigrated: (oldVersion, newVersion) => {
      this.info(LOG_CATEGORIES.PASSENGER_PROFILE, 'Perfil migrado', {
        oldVersion,
        newVersion
      });
    },
    
    profileValidationFailed: (errors, warnings) => {
      this.warn(LOG_CATEGORIES.PASSENGER_PROFILE, 'Falha na validação do perfil', {
        errors,
        warnings
      });
    }
  };
  
  /**
   * Logs específicos para visualização do mapa
   */
  mapVisualization = {
    routeCalculated: (from, to, distance, duration) => {
      this.debug(LOG_CATEGORIES.MAP_VISUALIZATION, 'Rota calculada', {
        from,
        to,
        distance,
        duration
      });
    },
    
    driverMarkerAdded: (lat, lng, driverName) => {
      this.debug(LOG_CATEGORIES.MAP_VISUALIZATION, 'Marcador do motorista adicionado', {
        lat,
        lng,
        driverName
      });
    },
    
    transitionToDestination: (destinationData) => {
      this.info(LOG_CATEGORIES.MAP_VISUALIZATION, 'Transição para rota do destino', destinationData);
    },
    
    scriptInjected: (scriptType, success) => {
      this.debug(LOG_CATEGORIES.MAP_VISUALIZATION, 'Script injetado no WebView', {
        scriptType,
        success
      });
    }
  };
  
  /**
   * Logs específicos para performance
   */
  performance = {
    measureStart: (operation) => {
      const key = `perf_${operation}_${Date.now()}`;
      this.performanceMarks = this.performanceMarks || {};
      this.performanceMarks[key] = Date.now();
      return key;
    },
    
    measureEnd: (key, operation, additionalData = {}) => {
      if (!this.performanceMarks || !this.performanceMarks[key]) return;
      
      const duration = Date.now() - this.performanceMarks[key];
      delete this.performanceMarks[key];
      
      this.debug(LOG_CATEGORIES.PERFORMANCE, `Performance: ${operation}`, {
        duration,
        ...additionalData
      });
      
      return duration;
    },
    
    slowOperation: (operation, duration, threshold = 1000) => {
      if (duration > threshold) {
        this.warn(LOG_CATEGORIES.PERFORMANCE, `Operação lenta detectada: ${operation}`, {
          duration,
          threshold
        });
      }
    }
  };
  
  /**
   * Salvar logs críticos no AsyncStorage
   */
  async saveCriticalLog(logEntry) {
    try {
      const key = `critical_log_${logEntry.timestamp}`;
      await AsyncStorage.setItem(key, JSON.stringify(logEntry));
      
      // Limpar logs antigos (manter apenas últimas 24h)
      const allKeys = await AsyncStorage.getAllKeys();
      const logKeys = allKeys.filter(key => key.startsWith('critical_log_'));
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const key of logKeys) {
        const timestamp = key.replace('critical_log_', '');
        if (new Date(timestamp).getTime() < dayAgo) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar log crítico:', error);
    }
  }
  
  /**
   * Obter resumo de métricas
   */
  getMetrics() {
    const sessionDuration = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      sessionDuration,
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      errorRate: this.metrics.callbacksFailures / Math.max(this.metrics.callbacksExecuted, 1),
      nameValidationRate: this.metrics.nameCorrections / Math.max(this.metrics.nameValidationCalls, 1)
    };
  }
  
  /**
   * Exportar logs para debug
   */
  exportLogs(levelFilter = null, categoryFilter = null) {
    let filteredLogs = this.logs;
    
    if (levelFilter !== null) {
      filteredLogs = filteredLogs.filter(log => LOG_LEVELS[log.level] <= levelFilter);
    }
    
    if (categoryFilter) {
      filteredLogs = filteredLogs.filter(log => log.category === categoryFilter);
    }
    
    return {
      metadata: {
        sessionId: this.sessionId,
        exportTime: new Date().toISOString(),
        totalLogs: this.logs.length,
        filteredLogs: filteredLogs.length,
        metrics: this.getMetrics()
      },
      logs: filteredLogs
    };
  }
  
  /**
   * Limpar logs
   */
  clearLogs() {
    this.logs = [];
    this.info(LOG_CATEGORIES.PERFORMANCE, 'Logs limpos');
  }
  
  /**
   * Definir nível de log
   */
  setLogLevel(level) {
    this.currentLevel = level;
    this.info(LOG_CATEGORIES.PERFORMANCE, `Nível de log alterado para: ${Object.keys(LOG_LEVELS)[level]}`);
  }
}

// Singleton instance
const debugLogger = new DebugLogger();

export default debugLogger;
export { LOG_LEVELS, LOG_CATEGORIES };

// Exemplo de uso:
/*
import debugLogger from '../utils/DebugLogger';

// Logs de WebSocket
debugLogger.websocket.connecting('ws://localhost:3000', { transports: ['websocket'] });
debugLogger.websocket.connected('socket_123', 'passenger', 'user_456');

// Logs de eventos de corrida
debugLogger.rideEvents.received('ride_accepted', { rideId: '123' }, 150);

// Logs de perfil
debugLogger.passengerProfile.nameValidation('userdemo', 'Passageiro', true);

// Performance
const perfKey = debugLogger.performance.measureStart('api_call');
// ... operação ...
debugLogger.performance.measureEnd(perfKey, 'api_call', { endpoint: '/rides' });

// Obter métricas
console.log(debugLogger.getMetrics());

// Exportar logs
const exportData = debugLogger.exportLogs(LOG_LEVELS.WARN, 'websocket');
*/