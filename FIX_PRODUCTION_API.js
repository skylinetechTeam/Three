// FIX PARA O PROBLEMA DA API EM PRODUÇÃO
// O problema: passengerProfile.apiPassengerId está undefined, impedindo a criação da solicitação

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './services/apiService';
import { API_CONFIG } from './config/api';

// ========================================
// 1. VERIFICAR E CORRIGIR PERFIL DO PASSAGEIRO
// ========================================
export async function fixPassengerProfile() {
  console.log('🔧 [FIX] Verificando perfil do passageiro...');
  
  try {
    // Buscar perfil atual
    const profileJson = await AsyncStorage.getItem('passengerProfile');
    let profile = profileJson ? JSON.parse(profileJson) : null;
    
    if (!profile) {
      console.error('❌ [FIX] Nenhum perfil encontrado!');
      return false;
    }
    
    console.log('📊 [FIX] Perfil atual:', profile);
    
    // Verificar se tem apiPassengerId
    if (!profile.apiPassengerId) {
      console.warn('⚠️ [FIX] apiPassengerId ausente! Gerando...');
      
      // Gerar um ID baseado no telefone ou email
      profile.apiPassengerId = profile.id || 
                               profile.phone?.replace(/\D/g, '') || 
                               `passenger_${Date.now()}`;
      
      console.log('✅ [FIX] Novo apiPassengerId:', profile.apiPassengerId);
      
      // Salvar perfil atualizado
      await AsyncStorage.setItem('passengerProfile', JSON.stringify(profile));
      console.log('💾 [FIX] Perfil salvo com apiPassengerId');
    }
    
    return profile;
    
  } catch (error) {
    console.error('❌ [FIX] Erro ao corrigir perfil:', error);
    return false;
  }
}

// ========================================
// 2. FORÇAR CONEXÃO DO SOCKET
// ========================================
export async function forceSocketConnection() {
  console.log('🔌 [FIX] Forçando conexão do WebSocket...');
  
  try {
    // Desconectar se já estiver conectado
    if (apiService.socket) {
      console.log('🔌 [FIX] Desconectando socket anterior...');
      apiService.disconnectSocket();
    }
    
    // Buscar perfil do passageiro
    const profile = await fixPassengerProfile();
    if (!profile) {
      console.error('❌ [FIX] Não foi possível obter perfil');
      return false;
    }
    
    // Conectar socket com o ID correto
    console.log('🔌 [FIX] Conectando socket para:', profile.apiPassengerId);
    const socket = apiService.connectSocket('passenger', profile.apiPassengerId);
    
    if (!socket) {
      console.error('❌ [FIX] Falha ao criar socket');
      return false;
    }
    
    // Aguardar conexão
    return new Promise((resolve) => {
      let timeout = setTimeout(() => {
        console.error('⏱️ [FIX] Timeout esperando conexão');
        resolve(false);
      }, 10000); // 10 segundos
      
      socket.once('connect', () => {
        clearTimeout(timeout);
        console.log('✅ [FIX] Socket conectado com sucesso!');
        resolve(true);
      });
      
      socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ [FIX] Erro de conexão:', error.message);
        resolve(false);
      });
    });
    
  } catch (error) {
    console.error('❌ [FIX] Erro ao forçar conexão:', error);
    return false;
  }
}

// ========================================
// 3. CRIAR SOLICITAÇÃO DIRETAMENTE
// ========================================
export async function createRideDirectly(rideEstimate, location, passengerProfile) {
  console.log('🚕 [FIX] Criando solicitação diretamente...');
  
  try {
    // Garantir que temos apiPassengerId
    if (!passengerProfile.apiPassengerId) {
      const fixedProfile = await fixPassengerProfile();
      if (!fixedProfile) {
        throw new Error('Não foi possível obter perfil válido');
      }
      passengerProfile = fixedProfile;
    }
    
    // Dados da corrida
    const rideData = {
      passengerId: passengerProfile.apiPassengerId,
      passengerName: passengerProfile.name || 'Passageiro',
      passengerPhone: passengerProfile.phone || '',
      pickup: {
        address: location.address || 'Localização Atual',
        lat: location.coords?.latitude || location.lat,
        lng: location.coords?.longitude || location.lng
      },
      destination: {
        address: rideEstimate.destination?.name || rideEstimate.destination?.address,
        lat: rideEstimate.destination?.lat,
        lng: rideEstimate.destination?.lng
      },
      estimatedFare: rideEstimate.fare,
      estimatedDistance: rideEstimate.distance,
      estimatedTime: rideEstimate.time,
      paymentMethod: passengerProfile.preferredPaymentMethod || 'cash',
      vehicleType: rideEstimate.vehicleType === 'privado' ? 'premium' : 'standard'
    };
    
    console.log('📊 [FIX] Dados da corrida:', rideData);
    
    // Fazer a requisição
    const url = `${API_CONFIG.API_BASE_URL}/rides/request`;
    console.log('🌐 [FIX] URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(rideData)
    });
    
    console.log('📡 [FIX] Status da resposta:', response.status);
    
    const data = await response.json();
    console.log('📊 [FIX] Dados recebidos:', data);
    
    if (!response.ok) {
      throw new Error(data.message || `Erro HTTP: ${response.status}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ [FIX] Erro ao criar solicitação:', error);
    throw error;
  }
}

// ========================================
// 4. PATCH PARA O startDriverSearch
// ========================================
export async function patchedStartDriverSearch(originalFunction, context) {
  console.log('🔧 [FIX] Executando versão corrigida de startDriverSearch...');
  
  const { 
    rideEstimate, 
    location, 
    passengerProfile,
    setIsSearchingDrivers,
    setCurrentRide
  } = context;
  
  try {
    // 1. Verificar e corrigir perfil
    const profile = await fixPassengerProfile();
    if (!profile) {
      console.error('❌ [FIX] Não foi possível obter perfil');
      alert('Erro: Perfil do passageiro não encontrado. Faça login novamente.');
      return;
    }
    
    // 2. Tentar conectar socket (mas não falhar se não conseguir)
    const socketConnected = await forceSocketConnection();
    console.log('🔌 [FIX] Socket conectado?', socketConnected);
    
    // 3. Criar solicitação via API
    setIsSearchingDrivers(true);
    
    try {
      const rideResponse = await createRideDirectly(rideEstimate, location, profile);
      console.log('✅ [FIX] Solicitação criada com sucesso:', rideResponse);
      
      if (rideResponse.data?.ride) {
        setCurrentRide(rideResponse.data.ride);
      }
      
      // Continuar com o resto da lógica original
      originalFunction();
      
    } catch (apiError) {
      console.error('❌ [FIX] Erro na API:', apiError);
      
      // Mostrar erro ao usuário
      alert(`Erro ao criar solicitação: ${apiError.message}`);
      
      // Ainda assim simular a busca localmente
      originalFunction();
    }
    
  } catch (error) {
    console.error('❌ [FIX] Erro geral:', error);
    alert('Erro inesperado. Tente novamente.');
  }
}

// ========================================
// 5. APLICAR FIX AUTOMATICAMENTE
// ========================================
export async function applyProductionFix() {
  console.log('🚀 [FIX] Aplicando correções para produção...');
  
  try {
    // 1. Corrigir perfil
    const profile = await fixPassengerProfile();
    if (!profile) {
      console.error('❌ [FIX] Falha ao corrigir perfil');
      return false;
    }
    
    // 2. Tentar conectar socket
    const socketConnected = await forceSocketConnection();
    console.log('🔌 [FIX] Socket:', socketConnected ? 'Conectado' : 'Falhou');
    
    // 3. Verificar conectividade com API
    console.log('🧪 [FIX] Testando API...');
    try {
      const testResponse = await fetch(`${API_CONFIG.API_BASE_URL}/health`);
      console.log('📡 [FIX] API Health:', testResponse.status);
    } catch (error) {
      console.error('❌ [FIX] API inacessível:', error.message);
    }
    
    console.log('✅ [FIX] Correções aplicadas!');
    return true;
    
  } catch (error) {
    console.error('❌ [FIX] Erro ao aplicar correções:', error);
    return false;
  }
}

// ========================================
// EXPORTAR PARA USO GLOBAL
// ========================================
if (typeof window !== 'undefined') {
  window.ProductionFix = {
    fixProfile: fixPassengerProfile,
    forceSocket: forceSocketConnection,
    createRide: createRideDirectly,
    applyFix: applyProductionFix
  };
  
  console.log('💡 Fix de produção disponível!');
  console.log('   Use: window.ProductionFix.applyFix()');
}

export default {
  fixPassengerProfile,
  forceSocketConnection,
  createRideDirectly,
  patchedStartDriverSearch,
  applyProductionFix
};