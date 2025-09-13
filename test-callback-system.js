/**
 * Ferramenta de Teste para Sistema de Callbacks de Corrida
 * 
 * Este arquivo permite testar sistematicamente os callbacks WebSocket
 * para identificar e diagnosticar problemas de entrega de notificações.
 */

import apiService from './services/apiService.js';

class CallbackTester {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * Inicializar sistema de testes
   */
  async initialize(userType = 'passenger', userId = 'test-passenger-123') {
    console.log('🧪 [CALLBACK TESTER] Inicializando sistema de testes...');
    
    try {
      // Conectar com apiService
      console.log('🔌 Conectando WebSocket para testes...');
      await apiService.connectSocketWithCheck(userType, userId);
      
      // Aguardar conexão estabilizar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!apiService.socket || !apiService.socket.connected) {
        throw new Error('Falha na conexão WebSocket');
      }
      
      console.log('✅ Conexão WebSocket estabelecida para testes');
      return true;
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Testar callback específico
   */
  async testSpecificCallback(eventName, testData = null) {
    console.log(`🎯 [TESTE] Testando callback: ${eventName}`);
    
    return new Promise((resolve) => {
      let callbackTriggered = false;
      let callbackData = null;
      
      // Registrar callback de teste temporário
      const testCallback = (data) => {
        console.log(`✅ [TESTE] Callback ${eventName} foi executado!`, data);
        callbackTriggered = true;
        callbackData = data;
      };
      
      // Registrar o callback
      const removeCallback = apiService.onEvent(eventName, testCallback);
      
      // Simular evento se dados de teste fornecidos
      if (testData) {
        setTimeout(() => {
          apiService.triggerCallbacks(eventName, testData);
        }, 500);
      }
      
      // Verificar resultado após timeout
      setTimeout(() => {
        const result = {
          event: eventName,
          success: callbackTriggered,
          data: callbackData,
          timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (callbackTriggered) {
          console.log(`✅ [TESTE] ${eventName} - SUCESSO`);
        } else {
          console.log(`❌ [TESTE] ${eventName} - FALHOU`);
        }
        
        // Remover callback de teste
        removeCallback();
        
        resolve(result);
      }, 3000);
    });
  }

  /**
   * Teste completo de todos os callbacks críticos
   */
  async runFullTest() {
    console.log('🚀 [TESTE COMPLETO] Iniciando bateria completa de testes...');
    this.isRunning = true;
    this.testResults = [];
    
    const criticalEvents = [
      {
        name: 'ride_accepted',
        data: {
          rideId: 'test-ride-001',
          driver: {
            id: 'test-driver-001',
            name: 'Motorista Teste',
            phone: '+244 900 000 000'
          },
          estimatedArrival: '5-10 minutos',
          test: true
        }
      },
      {
        name: 'ride_rejected',
        data: {
          rideId: 'test-ride-002',
          reason: 'Teste de rejeição',
          test: true
        }
      },
      {
        name: 'ride_started',
        data: {
          rideId: 'test-ride-003',
          message: 'Corrida iniciada - teste',
          test: true
        }
      },
      {
        name: 'ride_completed',
        data: {
          rideId: 'test-ride-004',
          fare: 500,
          test: true
        }
      },
      {
        name: 'ride_cancelled',
        data: {
          rideId: 'test-ride-005',
          cancelledBy: 'driver',
          reason: 'Teste de cancelamento',
          test: true
        }
      },
      {
        name: 'no_drivers_available',
        data: {
          rideId: 'test-ride-006',
          message: 'Nenhum motorista disponível - teste',
          test: true
        }
      }
    ];

    // Executar testes sequencialmente
    for (const event of criticalEvents) {
      console.log(`📋 [TESTE] Executando: ${event.name}`);
      await this.testSpecificCallback(event.name, event.data);
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.isRunning = false;
    this.generateReport();
  }

  /**
   * Teste de conectividade básica
   */
  async testConnectivity() {
    console.log('🔍 [CONECTIVIDADE] Testando conectividade básica...');
    
    const tests = [
      {
        name: 'API Health Check',
        test: () => apiService.testApiConnection()
      },
      {
        name: 'WebSocket Connection',
        test: () => Promise.resolve({
          success: apiService.socket?.connected || false,
          socketId: apiService.socket?.id
        })
      },
      {
        name: 'Callback Registration',
        test: () => Promise.resolve({
          success: apiService.eventCallbacks?.size > 0,
          callbackCount: apiService.eventCallbacks?.size || 0
        })
      }
    ];

    for (const test of tests) {
      try {
        console.log(`🔍 Testando: ${test.name}...`);
        const result = await test.test();
        
        if (result.success) {
          console.log(`✅ ${test.name}: PASSOU`);
        } else {
          console.log(`❌ ${test.name}: FALHOU`, result);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERRO`, error.message);
      }
    }
  }

  /**
   * Diagnóstico detalhado do sistema
   */
  diagnoseSystem() {
    console.log('🔬 [DIAGNÓSTICO] Analisando sistema...');
    
    // Estado do apiService
    console.log('📊 Estado do ApiService:');
    console.log(`  - Socket conectado: ${apiService.socket?.connected || false}`);
    console.log(`  - Socket ID: ${apiService.socket?.id || 'N/A'}`);
    console.log(`  - User Type: ${apiService.userType || 'N/A'}`);
    console.log(`  - User ID: ${apiService.userId || 'N/A'}`);
    console.log(`  - Callbacks registrados: ${apiService.eventCallbacks?.size || 0}`);
    
    // Lista de callbacks
    if (apiService.eventCallbacks && apiService.eventCallbacks.size > 0) {
      console.log('📋 Callbacks registrados:');
      for (const [eventName, callbacks] of apiService.eventCallbacks.entries()) {
        console.log(`  - ${eventName}: ${callbacks.length} callback(s)`);
      }
    } else {
      console.warn('⚠️ NENHUM callback registrado!');
    }
    
    // Estado da conexão
    if (apiService.socket) {
      console.log('🔌 Detalhes da conexão:');
      console.log(`  - Transport: ${apiService.socket.io?.engine?.transport?.name || 'N/A'}`);
      console.log(`  - Ready State: ${apiService.socket.io?.engine?.readyState || 'N/A'}`);
    }
  }

  /**
   * Gerar relatório dos testes
   */
  generateReport() {
    console.log('\n📊 [RELATÓRIO] Resultado dos testes:');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(result => result.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`Total de testes: ${totalTests}`);
    console.log(`Sucessos: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Falhas: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    
    console.log('\n📋 Detalhes por teste:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.event}`);
    });
    
    if (failedTests > 0) {
      console.log('\n⚠️ Testes com falha:');
      this.testResults
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`  - ${result.event}: Callback não foi executado`);
        });
    }
    
    console.log('=' .repeat(50));
    
    // Recomendações
    if (failedTests > 0) {
      console.log('\n💡 Recomendações:');
      console.log('1. Verificar se callbacks estão sendo registrados antes da conexão');
      console.log('2. Verificar se os IDs do usuário estão corretos');
      console.log('3. Verificar logs do servidor para erros de entrega');
      console.log('4. Testar com diferentes tipos de usuário');
    } else {
      console.log('\n🎉 Todos os testes passaram! Sistema funcionando corretamente.');
    }
  }

  /**
   * Teste de performance dos callbacks
   */
  async testCallbackPerformance(eventName = 'ride_accepted', iterations = 10) {
    console.log(`⚡ [PERFORMANCE] Testando performance do callback ${eventName} (${iterations} iterações)...`);
    
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      await new Promise((resolve) => {
        const testCallback = () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          results.push(duration);
          resolve();
        };
        
        const removeCallback = apiService.onEvent(eventName, testCallback);
        
        // Simular evento
        setTimeout(() => {
          apiService.triggerCallbacks(eventName, { test: true, iteration: i + 1 });
        }, 10);
        
        // Timeout de segurança
        setTimeout(() => {
          removeCallback();
          resolve();
        }, 5000);
      });
      
      // Pausa entre iterações
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Análise de performance
    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const minTime = Math.min(...results);
    const maxTime = Math.max(...results);
    
    console.log(`📊 [PERFORMANCE] Resultados para ${eventName}:`);
    console.log(`  - Tempo médio: ${avgTime.toFixed(2)}ms`);
    console.log(`  - Tempo mínimo: ${minTime}ms`);
    console.log(`  - Tempo máximo: ${maxTime}ms`);
    console.log(`  - Iterações bem-sucedidas: ${results.length}/${iterations}`);
    
    return {
      avgTime,
      minTime,
      maxTime,
      successRate: (results.length / iterations) * 100
    };
  }
}

// Instância global do tester
const callbackTester = new CallbackTester();

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.callbackTester = callbackTester;
  
  // Funções de conveniência para o console
  window.testCallbacks = () => callbackTester.runFullTest();
  window.testConnectivity = () => callbackTester.testConnectivity();
  window.diagnoseCallbacks = () => callbackTester.diagnoseSystem();
  window.testRideAccepted = () => callbackTester.testSpecificCallback('ride_accepted', {
    rideId: 'console-test-001',
    driver: { name: 'Teste Console' },
    test: true
  });
}

export default callbackTester;

// Instruções de uso
console.log(`
🧪 CALLBACK TESTER CARREGADO

Funções disponíveis no console:
- testCallbacks()      : Executar todos os testes
- testConnectivity()   : Testar conectividade básica  
- diagnoseCallbacks()  : Diagnóstico detalhado
- testRideAccepted()   : Testar callback específico

Uso programático:
import callbackTester from './test-callback-system.js';
await callbackTester.initialize('passenger', 'test-123');
await callbackTester.runFullTest();
`);