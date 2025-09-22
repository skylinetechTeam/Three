// FALLBACK PARA PRODUÇÃO - Solução temporária para requisições falhando

import { API_CONFIG } from './config/api';

// Lista de URLs para tentar em ordem de prioridade
const API_URLS = [
  'https://three-api-9fac.onrender.com/api',
  // Adicione outras URLs de backup aqui se tiver
];

// Função auxiliar com retry e fallback
export async function robustFetch(endpoint, options = {}, maxRetries = 3) {
  console.log(`🔄 [RobustFetch] Tentando: ${endpoint}`);
  
  for (const baseUrl of API_URLS) {
    const fullUrl = `${baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Tentativa ${attempt}/${maxRetries} em ${fullUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
        
        const response = await fetch(fullUrl, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Sucesso na tentativa ${attempt} com ${baseUrl}`);
          const data = await response.json();
          return { success: true, data, url: fullUrl };
        } else {
          console.warn(`⚠️ Resposta não-OK: ${response.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
        
        if (attempt === maxRetries) {
          console.error(`💀 Todas as tentativas falharam para ${baseUrl}`);
        } else {
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  throw new Error('Todas as tentativas de conexão com a API falharam');
}

// Substituir a função createRideRequest com versão robusta
export async function createRideRequestWithFallback(rideData) {
  console.log('🚕 [Fallback] Criando solicitação de corrida com fallback...');
  
  try {
    // Tentar via fetch robusto
    const result = await robustFetch('/rides/request', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
    
    if (result.success) {
      console.log('✅ Solicitação criada com sucesso via fallback');
      return result.data;
    }
    
  } catch (fetchError) {
    console.error('❌ Falha no fetch robusto:', fetchError);
    
    // FALLBACK FINAL: Criar corrida localmente e sincronizar depois
    console.log('📱 Criando corrida localmente para sincronizar depois...');
    
    const localRide = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...rideData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      isLocal: true,
      syncPending: true
    };
    
    // Salvar no AsyncStorage para sincronizar depois
    try {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      const pendingRides = await AsyncStorage.getItem('pending_rides');
      const rides = pendingRides ? JSON.parse(pendingRides) : [];
      rides.push(localRide);
      await AsyncStorage.setItem('pending_rides', JSON.stringify(rides));
      
      console.log('💾 Corrida salva localmente para sincronização posterior');
      
      // Tentar sincronizar em background
      setTimeout(() => syncPendingRides(), 5000);
      
    } catch (storageError) {
      console.error('❌ Erro ao salvar localmente:', storageError);
    }
    
    return {
      success: true,
      data: { ride: localRide },
      message: 'Corrida criada localmente, será sincronizada quando possível'
    };
  }
}

// Função para sincronizar corridas pendentes
async function syncPendingRides() {
  try {
    const { AsyncStorage } = require('@react-native-async-storage/async-storage');
    const pendingRides = await AsyncStorage.getItem('pending_rides');
    
    if (!pendingRides) return;
    
    const rides = JSON.parse(pendingRides);
    const stillPending = [];
    
    for (const ride of rides) {
      try {
        // Remover campos locais antes de enviar
        const { isLocal, syncPending, ...rideData } = ride;
        
        const result = await robustFetch('/rides/request', {
          method: 'POST',
          body: JSON.stringify(rideData),
        });
        
        if (result.success) {
          console.log(`✅ Corrida ${ride.id} sincronizada com sucesso`);
        } else {
          stillPending.push(ride);
        }
      } catch (error) {
        console.error(`❌ Falha ao sincronizar corrida ${ride.id}`);
        stillPending.push(ride);
      }
    }
    
    // Salvar corridas que ainda não foram sincronizadas
    if (stillPending.length > 0) {
      await AsyncStorage.setItem('pending_rides', JSON.stringify(stillPending));
      
      // Tentar novamente em 30 segundos
      setTimeout(() => syncPendingRides(), 30000);
    } else {
      // Limpar se todas foram sincronizadas
      await AsyncStorage.removeItem('pending_rides');
      console.log('✅ Todas as corridas pendentes foram sincronizadas');
    }
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar corridas pendentes:', error);
  }
}

// Exportar para uso
export default {
  robustFetch,
  createRideRequestWithFallback,
  syncPendingRides
};