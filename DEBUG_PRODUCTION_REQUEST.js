// DEBUG SCRIPT - Diagnóstico do problema de solicitações não chegarem na API em produção
// Este script adiciona logging extensivo e intercepta as requisições para identificar o problema

import apiService from './services/apiService';
import { API_CONFIG } from './config/api';

// ===========================================
// 1. INTERCEPTOR DE FETCH GLOBAL
// ===========================================
const originalFetch = global.fetch;
let requestCounter = 0;

global.fetch = async function(url, options = {}) {
  const requestId = ++requestCounter;
  const startTime = Date.now();
  
  console.log(`\n🔵 [FETCH #${requestId}] INICIANDO REQUISIÇÃO`);
  console.log(`📍 URL: ${url}`);
  console.log(`📍 Método: ${options.method || 'GET'}`);
  console.log(`📍 Headers:`, options.headers);
  
  // Verificar se é uma requisição de corrida
  if (url.includes('/rides/request')) {
    console.log(`🚨 [FETCH #${requestId}] REQUISIÇÃO DE CORRIDA DETECTADA!`);
    console.log(`📊 Body enviado:`, options.body);
    
    try {
      const bodyData = JSON.parse(options.body);
      console.log(`📊 Dados parseados:`, bodyData);
    } catch (e) {
      console.log(`⚠️ Não foi possível parsear o body`);
    }
  }
  
  try {
    // Fazer a requisição real
    console.log(`🌐 [FETCH #${requestId}] Enviando para servidor...`);
    const response = await originalFetch(url, options);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [FETCH #${requestId}] RESPOSTA RECEBIDA`);
    console.log(`⏱️ Tempo: ${duration}ms`);
    console.log(`📍 Status: ${response.status} ${response.statusText}`);
    console.log(`📍 OK: ${response.ok}`);
    
    // Clonar response para ler o body sem consumir
    const clonedResponse = response.clone();
    
    try {
      const responseData = await clonedResponse.json();
      console.log(`📊 [FETCH #${requestId}] Resposta JSON:`, responseData);
    } catch (e) {
      console.log(`ℹ️ [FETCH #${requestId}] Resposta não é JSON ou erro ao parsear`);
    }
    
    return response;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [FETCH #${requestId}] ERRO NA REQUISIÇÃO`);
    console.error(`⏱️ Tempo até erro: ${duration}ms`);
    console.error(`📍 Tipo de erro: ${error.name}`);
    console.error(`📍 Mensagem: ${error.message}`);
    console.error(`📍 Stack:`, error.stack);
    
    // Verificar se é erro de rede/CORS
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error(`🚨 POSSÍVEL PROBLEMA DE REDE/CORS!`);
      console.error(`💡 Verificar:`);
      console.error(`   1. URL está acessível? ${url}`);
      console.error(`   2. CORS está configurado no servidor?`);
      console.error(`   3. Certificado SSL válido (se HTTPS)?`);
      console.error(`   4. Firewall/Proxy bloqueando?`);
    }
    
    throw error;
  }
};

// ===========================================
// 2. VERIFICAR CONFIGURAÇÃO DE AMBIENTE
// ===========================================
export function checkEnvironmentConfig() {
  console.log('\n🔍 VERIFICANDO CONFIGURAÇÃO DE AMBIENTE');
  console.log('================================');
  
  // Verificar URLs configuradas
  console.log('📍 API_BASE_URL:', API_CONFIG.API_BASE_URL);
  console.log('📍 SOCKET_URL:', API_CONFIG.SOCKET_URL);
  
  // Verificar variáveis de ambiente
  console.log('📍 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'NÃO DEFINIDA');
  console.log('📍 EXPO_PUBLIC_SOCKET_URL:', process.env.EXPO_PUBLIC_SOCKET_URL || 'NÃO DEFINIDA');
  
  // Verificar NODE_ENV
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);
  console.log('📍 __DEV__:', __DEV__);
  
  // Verificar se estamos em produção
  const isProduction = process.env.NODE_ENV === 'production' || !__DEV__;
  console.log('📍 Em produção?:', isProduction);
  
  // Verificar se as URLs parecem estar corretas
  if (API_CONFIG.API_BASE_URL.includes('localhost') || API_CONFIG.API_BASE_URL.includes('127.0.0.1')) {
    console.warn('⚠️ API_BASE_URL aponta para localhost! Isso não funcionará em produção!');
  }
  
  if (API_CONFIG.API_BASE_URL.includes('ngrok')) {
    console.warn('⚠️ API_BASE_URL usa ngrok. Certifique-se que o túnel está ativo!');
  }
  
  console.log('================================\n');
}

// ===========================================
// 3. TESTE DE CONECTIVIDADE
// ===========================================
export async function testAPIConnectivity() {
  console.log('\n🧪 TESTANDO CONECTIVIDADE COM API');
  console.log('================================');
  
  const endpoints = [
    { name: 'Health Check', url: `${API_CONFIG.API_BASE_URL}/health`, method: 'GET' },
    { name: 'API Info', url: `${API_CONFIG.API_BASE_URL}`, method: 'GET' },
    { name: 'Test POST', url: `${API_CONFIG.API_BASE_URL}/test`, method: 'POST' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testando: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Método: ${endpoint.method}`);
    
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (endpoint.method === 'POST') {
        options.body = JSON.stringify({ test: true, timestamp: Date.now() });
      }
      
      const startTime = Date.now();
      const response = await fetch(endpoint.url, options);
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ⏱️ Tempo: ${duration}ms`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`   📊 Resposta:`, data);
        } catch (e) {
          const text = await response.text();
          console.log(`   📄 Resposta (texto):`, text.substring(0, 100));
        }
      }
      
    } catch (error) {
      console.error(`   ❌ ERRO: ${error.message}`);
      
      // Análise detalhada do erro
      if (error.message.includes('Network request failed')) {
        console.error(`   🔴 Problema de rede detectado!`);
        console.error(`   Possíveis causas:`);
        console.error(`   - API offline`);
        console.error(`   - URL incorreta`);
        console.error(`   - Firewall/proxy bloqueando`);
        console.error(`   - Sem internet`);
      }
    }
  }
  
  console.log('================================\n');
}

// ===========================================
// 4. INTERCEPTOR ESPECÍFICO PARA createRideRequest
// ===========================================
const originalCreateRideRequest = apiService.createRideRequest.bind(apiService);

apiService.createRideRequest = async function(rideData) {
  console.log('\n🚕 [createRideRequest] INTERCEPTADO');
  console.log('📊 Dados da corrida:', rideData);
  console.log('📍 API URL será:', `${API_CONFIG.API_BASE_URL}/rides/request`);
  
  // Verificar dados obrigatórios
  const requiredFields = ['passengerId', 'passengerName', 'pickup', 'destination'];
  for (const field of requiredFields) {
    if (!rideData[field]) {
      console.error(`❌ Campo obrigatório ausente: ${field}`);
    }
  }
  
  try {
    console.log('🚀 Chamando função original...');
    const result = await originalCreateRideRequest(rideData);
    console.log('✅ [createRideRequest] Sucesso:', result);
    return result;
    
  } catch (error) {
    console.error('❌ [createRideRequest] ERRO CAPTURADO');
    console.error('Tipo:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Análise adicional
    if (error.message.includes('Network')) {
      console.error('🔴 ERRO DE REDE - Verificar:');
      console.error('1. A API está rodando?');
      console.error('2. A URL está correta?');
      console.error('3. Há bloqueio de firewall?');
      console.error('4. CORS está configurado?');
    }
    
    throw error;
  }
};

// ===========================================
// 5. MONITOR DE WEBSOCKET
// ===========================================
export function monitorWebSocket() {
  console.log('\n👁️ MONITORANDO WEBSOCKET');
  console.log('================================');
  
  if (!apiService.socket) {
    console.log('❌ Socket não está inicializado');
    return;
  }
  
  const socket = apiService.socket;
  
  console.log('📊 Estado do Socket:');
  console.log('   Conectado:', socket.connected);
  console.log('   ID:', socket.id);
  console.log('   URL:', API_CONFIG.SOCKET_URL);
  
  // Interceptar emissões
  const originalEmit = socket.emit.bind(socket);
  socket.emit = function(event, ...args) {
    console.log(`📤 [WS] Emitindo: ${event}`, args);
    return originalEmit(event, ...args);
  };
  
  // Monitorar todos os eventos
  const events = ['connect', 'disconnect', 'error', 'reconnect', 'ride_accepted', 'ride_request'];
  
  events.forEach(event => {
    socket.on(event, (...args) => {
      console.log(`📥 [WS] Evento recebido: ${event}`, args);
    });
  });
  
  console.log('✅ Monitor de WebSocket ativado');
  console.log('================================\n');
}

// ===========================================
// 6. FUNÇÃO PRINCIPAL DE DEBUG
// ===========================================
export async function runProductionDebug() {
  console.log('\n🔧 INICIANDO DEBUG DE PRODUÇÃO');
  console.log('=====================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('=====================================\n');
  
  // 1. Verificar configuração
  checkEnvironmentConfig();
  
  // 2. Testar conectividade
  await testAPIConnectivity();
  
  // 3. Monitorar WebSocket se existir
  if (apiService.socket) {
    monitorWebSocket();
  }
  
  // 4. Criar uma requisição de teste
  console.log('\n🧪 FAZENDO REQUISIÇÃO DE TESTE');
  console.log('================================');
  
  const testRideData = {
    passengerId: 'test_passenger_123',
    passengerName: 'Teste Debug',
    passengerPhone: '+244 123 456 789',
    pickup: {
      address: 'Teste Origem',
      lat: -8.8390,
      lng: 13.2894
    },
    destination: {
      address: 'Teste Destino',
      lat: -8.8500,
      lng: 13.3000
    },
    estimatedFare: 1000,
    estimatedDistance: 5000,
    estimatedTime: 600,
    paymentMethod: 'cash',
    vehicleType: 'standard'
  };
  
  try {
    console.log('📤 Enviando requisição de teste...');
    const result = await apiService.createRideRequest(testRideData);
    console.log('✅ Requisição de teste bem-sucedida!');
    console.log('Resposta:', result);
  } catch (error) {
    console.error('❌ Requisição de teste falhou!');
    console.error('Erro:', error);
  }
  
  console.log('================================\n');
  console.log('🏁 DEBUG COMPLETO!');
}

// ===========================================
// EXPORTAR PARA USO GLOBAL
// ===========================================
if (typeof window !== 'undefined') {
  window.ProductionDebug = {
    run: runProductionDebug,
    checkConfig: checkEnvironmentConfig,
    testAPI: testAPIConnectivity,
    monitorWS: monitorWebSocket
  };
  
  console.log('💡 Debug de produção disponível!');
  console.log('   Use: window.ProductionDebug.run()');
}

export default {
  runProductionDebug,
  checkEnvironmentConfig,
  testAPIConnectivity,
  monitorWebSocket
};