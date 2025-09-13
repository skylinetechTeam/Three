/**
 * Testes de Validação para Correção do Sistema de Feedback ao Passageiro
 * 
 * Este arquivo contém testes abrangentes para validar as correções implementadas:
 * 1. Sistema de notificação WebSocket
 * 2. Validação de nomes de passageiros
 * 3. Callbacks e listeners
 * 4. Visualização do mapa
 * 5. Performance e conectividade
 */

import debugLogger from '../utils/DebugLogger';
import apiService from '../services/apiService';
import LocalDatabase from '../services/localDatabase';

class SystemValidator {
  constructor() {
    this.testResults = {};
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * Executar todos os testes
   */
  async runAllTests() {
    console.log('🧪 [VALIDATOR] Iniciando testes completos do sistema corrigido');
    debugLogger.info('testing', 'Iniciando bateria completa de testes');
    
    const startTime = Date.now();
    
    try {
      // 1. Testes de validação de nome
      await this.testPassengerNameValidation();
      
      // 2. Testes do sistema WebSocket
      await this.testWebSocketSystem();
      
      // 3. Testes de callbacks
      await this.testCallbackSystem();
      
      // 4. Testes do LocalDatabase
      await this.testLocalDatabaseFunctions();
      
      // 5. Testes de conectividade da API
      await this.testApiConnectivity();
      
      // 6. Testes de simulação de corrida
      await this.testRideFlowSimulation();
      
      const duration = Date.now() - startTime;
      
      // Resumo final
      this.printTestSummary(duration);
      
      return this.getTestResults();
      
    } catch (error) {
      console.error('🚨 [VALIDATOR] Erro crítico durante os testes:', error);
      debugLogger.error('testing', 'Erro crítico durante os testes', { error: error.message, stack: error.stack });
      
      return {
        success: false,
        error: error.message,
        results: this.testResults
      };
    }
  }
  
  /**
   * Testes de validação de nome do passageiro
   */
  async testPassengerNameValidation() {
    console.log('👤 [VALIDATOR] Testando validação de nomes de passageiros...');
    
    const testCases = [
      { input: { name: 'userdemo' }, expected: 'Passageiro', description: 'Nome demo simples' },
      { input: { name: 'USER DEMO' }, expected: 'Passageiro', description: 'Nome demo maiúsculo' },
      { input: { name: 'João Silva' }, expected: 'João Silva', description: 'Nome válido' },
      { input: { name: '' }, expected: 'Passageiro', description: 'Nome vazio' },
      { input: { name: null }, expected: 'Passageiro', description: 'Nome null' },
      { input: { nome: 'Maria Santos' }, expected: 'Maria Santos', description: 'Campo nome alternativo' },
      { input: { email: 'test@example.com' }, expected: 'Test', description: 'Nome do email' },
      { input: { email: 'demo@test.com' }, expected: 'Passageiro', description: 'Email demo' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      try {
        const result = LocalDatabase.getSafePassengerName(testCase.input);
        
        if (result === testCase.expected) {
          this.recordTest(`name_validation_${testCase.description}`, true, {\n            input: testCase.input,\n            expected: testCase.expected,\n            result\n          });\n          passed++;\n        } else {\n          this.recordTest(`name_validation_${testCase.description}`, false, {\n            input: testCase.input,\n            expected: testCase.expected,\n            result,\n            error: `Esperado '${testCase.expected}', obtido '${result}'`\n          });\n          failed++;\n        }\n      } catch (error) {\n        this.recordTest(`name_validation_${testCase.description}`, false, {\n          input: testCase.input,\n          error: error.message\n        });\n        failed++;\n      }\n    }\n    \n    console.log(`✅ [VALIDATOR] Validação de nomes: ${passed} passou, ${failed} falhou`);\n  }\n  \n  /**\n   * Testes do sistema WebSocket\n   */\n  async testWebSocketSystem() {\n    console.log('🔌 [VALIDATOR] Testando sistema WebSocket...');\n    \n    try {\n      // Teste 1: Verificar se APIService foi importado corretamente\n      const hasSocket = typeof apiService.connectSocket === 'function';\n      this.recordTest('websocket_api_service_available', hasSocket, {\n        hasConnectMethod: typeof apiService.connectSocket === 'function',\n        hasCallbacksMap: apiService.eventCallbacks instanceof Map\n      });\n      \n      // Teste 2: Verificar eventCallbacks\n      const callbacksInitialized = apiService.eventCallbacks instanceof Map;\n      this.recordTest('websocket_callbacks_initialized', callbacksInitialized);\n      \n      // Teste 3: Testar registro de callback\n      const testCallback = (data) => console.log('Test callback:', data);\n      const remover = apiService.onEvent('test_event', testCallback);\n      \n      const callbackRegistered = apiService.eventCallbacks.has('test_event') && \n                                 apiService.eventCallbacks.get('test_event').length > 0;\n      \n      this.recordTest('websocket_callback_registration', callbackRegistered);\n      \n      // Teste 4: Testar remoção de callback\n      if (typeof remover === 'function') {\n        remover();\n        const callbackRemoved = !apiService.eventCallbacks.has('test_event') || \n                               apiService.eventCallbacks.get('test_event').length === 0;\n        this.recordTest('websocket_callback_removal', callbackRemoved);\n      }\n      \n      // Teste 5: Verificar se funções essenciais existem\n      const essentialMethods = [\n        'connectSocket',\n        'disconnectSocket', \n        'onEvent',\n        'setupRideEventListeners',\n        'triggerCallbacks'\n      ];\n      \n      let methodsExist = 0;\n      for (const method of essentialMethods) {\n        if (typeof apiService[method] === 'function') {\n          methodsExist++;\n        }\n      }\n      \n      this.recordTest('websocket_essential_methods', methodsExist === essentialMethods.length, {\n        totalMethods: essentialMethods.length,\n        existingMethods: methodsExist\n      });\n      \n    } catch (error) {\n      this.recordTest('websocket_system_test', false, { error: error.message });\n    }\n  }\n  \n  /**\n   * Testes do sistema de callbacks\n   */\n  async testCallbackSystem() {\n    console.log('📞 [VALIDATOR] Testando sistema de callbacks...');\n    \n    try {\n      // Teste 1: Simular callback de ride_accepted\n      let callbackExecuted = false;\n      let receivedData = null;\n      \n      const testCallback = (data) => {\n        callbackExecuted = true;\n        receivedData = data;\n      };\n      \n      // Registrar callback\n      apiService.onEvent('test_ride_accepted', testCallback);\n      \n      // Simular evento\n      const testData = {\n        rideId: 'test_123',\n        driver: { name: 'Test Driver' },\n        test: true\n      };\n      \n      apiService.triggerCallbacks('test_ride_accepted', testData);\n      \n      // Aguardar um pouco para callback executar\n      await new Promise(resolve => setTimeout(resolve, 100));\n      \n      this.recordTest('callback_execution', callbackExecuted && receivedData, {\n        callbackExecuted,\n        dataReceived: !!receivedData,\n        expectedData: testData,\n        actualData: receivedData\n      });\n      \n      // Teste 2: Múltiplos callbacks\n      let callback1Executed = false;\n      let callback2Executed = false;\n      \n      apiService.onEvent('test_multiple', () => { callback1Executed = true; });\n      apiService.onEvent('test_multiple', () => { callback2Executed = true; });\n      \n      apiService.triggerCallbacks('test_multiple', {});\n      \n      await new Promise(resolve => setTimeout(resolve, 100));\n      \n      this.recordTest('multiple_callbacks', callback1Executed && callback2Executed, {\n        callback1: callback1Executed,\n        callback2: callback2Executed\n      });\n      \n    } catch (error) {\n      this.recordTest('callback_system_test', false, { error: error.message });\n    }\n  }\n  \n  /**\n   * Testes das funções do LocalDatabase\n   */\n  async testLocalDatabaseFunctions() {\n    console.log('💾 [VALIDATOR] Testando funções do LocalDatabase...');\n    \n    try {\n      // Teste 1: Funções essenciais existem\n      const essentialMethods = [\n        'getSafePassengerName',\n        'getNameFromUserProfile',\n        'createDefaultPassengerProfile',\n        'validateAndFixDemoName',\n        'getOrCreateSafePassengerProfile',\n        'validatePassengerProfile'\n      ];\n      \n      let methodsExist = 0;\n      for (const method of essentialMethods) {\n        if (typeof LocalDatabase[method] === 'function') {\n          methodsExist++;\n        }\n      }\n      \n      this.recordTest('localdatabase_methods', methodsExist === essentialMethods.length, {\n        totalMethods: essentialMethods.length,\n        existingMethods: methodsExist\n      });\n      \n      // Teste 2: Validação de perfil\n      const testProfile = {\n        name: 'userdemo',\n        email: 'test@example.com',\n        phone: '+244 900 000 000'\n      };\n      \n      const validation = LocalDatabase.validatePassengerProfile(testProfile);\n      const hasValidationStructure = validation.hasOwnProperty('isValid') && \n                                   validation.hasOwnProperty('errors') &&\n                                   validation.hasOwnProperty('warnings');\n      \n      this.recordTest('profile_validation', hasValidationStructure, {\n        validation,\n        hasCorrectStructure: hasValidationStructure\n      });\n      \n      // Teste 3: Criar perfil padrão\n      const userProfile = { email: 'newuser@test.com' };\n      const defaultProfile = await LocalDatabase.createDefaultPassengerProfile(userProfile);\n      \n      const profileCreated = defaultProfile && \n                           defaultProfile.name && \n                           defaultProfile.name !== 'userdemo';\n      \n      this.recordTest('create_default_profile', profileCreated, {\n        userProfile,\n        createdProfile: defaultProfile\n      });\n      \n    } catch (error) {\n      this.recordTest('localdatabase_test', false, { error: error.message });\n    }\n  }\n  \n  /**\n   * Teste de conectividade da API\n   */\n  async testApiConnectivity() {\n    console.log('📡 [VALIDATOR] Testando conectividade da API...');\n    \n    try {\n      // Teste básico de conectividade\n      const connectivityResult = await apiService.testApiConnection();\n      \n      this.recordTest('api_connectivity', connectivityResult.success, {\n        result: connectivityResult,\n        responseTime: connectivityResult.responseTime\n      });\n      \n    } catch (error) {\n      this.recordTest('api_connectivity', false, { error: error.message });\n    }\n  }\n  \n  /**\n   * Simulação de fluxo de corrida\n   */\n  async testRideFlowSimulation() {\n    console.log('🚗 [VALIDATOR] Testando simulação de fluxo de corrida...');\n    \n    try {\n      let eventSequence = [];\n      \n      // Registrar listeners para capturar eventos\n      const events = ['ride_accepted', 'ride_started', 'ride_completed'];\n      \n      for (const eventName of events) {\n        apiService.onEvent(eventName, (data) => {\n          eventSequence.push({ event: eventName, timestamp: Date.now(), data });\n        });\n      }\n      \n      // Simular sequência de eventos\n      const rideData = {\n        rideId: 'simulation_123',\n        driver: { name: 'Simulation Driver' },\n        test: true\n      };\n      \n      // Simular ride_accepted\n      apiService.triggerCallbacks('ride_accepted', rideData);\n      await new Promise(resolve => setTimeout(resolve, 50));\n      \n      // Simular ride_started\n      apiService.triggerCallbacks('ride_started', { ...rideData, status: 'started' });\n      await new Promise(resolve => setTimeout(resolve, 50));\n      \n      // Simular ride_completed\n      apiService.triggerCallbacks('ride_completed', { ...rideData, status: 'completed' });\n      await new Promise(resolve => setTimeout(resolve, 50));\n      \n      const allEventsReceived = eventSequence.length >= 3;\n      const correctSequence = eventSequence[0]?.event === 'ride_accepted' &&\n                             eventSequence[1]?.event === 'ride_started' &&\n                             eventSequence[2]?.event === 'ride_completed';\n      \n      this.recordTest('ride_flow_simulation', allEventsReceived && correctSequence, {\n        eventSequence,\n        expectedEvents: events.length,\n        receivedEvents: eventSequence.length,\n        correctOrder: correctSequence\n      });\n      \n    } catch (error) {\n      this.recordTest('ride_flow_simulation', false, { error: error.message });\n    }\n  }\n  \n  /**\n   * Registrar resultado de teste\n   */\n  recordTest(testName, passed, data = {}) {\n    this.totalTests++;\n    \n    if (passed) {\n      this.passedTests++;\n      console.log(`✅ [VALIDATOR] ${testName}: PASSOU`);\n      debugLogger.debug('testing', `Teste passou: ${testName}`, data);\n    } else {\n      this.failedTests++;\n      console.log(`❌ [VALIDATOR] ${testName}: FALHOU`);\n      debugLogger.warn('testing', `Teste falhou: ${testName}`, data);\n    }\n    \n    this.testResults[testName] = {\n      passed,\n      timestamp: new Date().toISOString(),\n      data\n    };\n  }\n  \n  /**\n   * Obter resultados dos testes\n   */\n  getTestResults() {\n    return {\n      summary: {\n        total: this.totalTests,\n        passed: this.passedTests,\n        failed: this.failedTests,\n        successRate: this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(2) + '%' : '0%'\n      },\n      results: this.testResults,\n      metrics: debugLogger.getMetrics()\n    };\n  }\n  \n  /**\n   * Imprimir resumo dos testes\n   */\n  printTestSummary(duration) {\n    const successRate = this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(2) : 0;\n    \n    console.log('\\n📊 [VALIDATOR] RESUMO DOS TESTES:');\n    console.log('═'.repeat(50));\n    console.log(`📋 Total de testes: ${this.totalTests}`);\n    console.log(`✅ Testes passou: ${this.passedTests}`);\n    console.log(`❌ Testes falhou: ${this.failedTests}`);\n    console.log(`📈 Taxa de sucesso: ${successRate}%`);\n    console.log(`⏱️ Duração: ${duration}ms`);\n    console.log('═'.repeat(50));\n    \n    if (this.failedTests > 0) {\n      console.log('\\n⚠️ [VALIDATOR] TESTES QUE FALHARAM:');\n      for (const [testName, result] of Object.entries(this.testResults)) {\n        if (!result.passed) {\n          console.log(`❌ ${testName}: ${JSON.stringify(result.data)}`);\n        }\n      }\n    }\n    \n    // Log final\n    debugLogger.info('testing', 'Testes completos', {\n      summary: this.getTestResults().summary,\n      duration\n    });\n  }\n}\n\n// Função para executar testes\nexport const runSystemValidation = async () => {\n  const validator = new SystemValidator();\n  return await validator.runAllTests();\n};\n\nexport default SystemValidator;\n\n// Função para executar apenas testes específicos\nexport const runSpecificTests = async (testCategories = []) => {\n  const validator = new SystemValidator();\n  \n  console.log(`🧪 [VALIDATOR] Executando testes específicos: ${testCategories.join(', ')}`);\n  \n  if (testCategories.includes('names')) {\n    await validator.testPassengerNameValidation();\n  }\n  if (testCategories.includes('websocket')) {\n    await validator.testWebSocketSystem();\n  }\n  if (testCategories.includes('callbacks')) {\n    await validator.testCallbackSystem();\n  }\n  if (testCategories.includes('database')) {\n    await validator.testLocalDatabaseFunctions();\n  }\n  if (testCategories.includes('api')) {\n    await validator.testApiConnectivity();\n  }\n  if (testCategories.includes('simulation')) {\n    await validator.testRideFlowSimulation();\n  }\n  \n  validator.printTestSummary(0);\n  return validator.getTestResults();\n};\n\n/*\n// Exemplo de uso:\n\nimport { runSystemValidation, runSpecificTests } from '../utils/SystemValidator';\n\n// Executar todos os testes\nconst allResults = await runSystemValidation();\nconsole.log('Resultados completos:', allResults);\n\n// Executar apenas testes específicos\nconst specificResults = await runSpecificTests(['names', 'websocket']);\nconsole.log('Resultados específicos:', specificResults);\n*/