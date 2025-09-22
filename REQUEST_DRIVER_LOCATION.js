// SCRIPT PARA SOLICITAR LOCALIZAÇÃO DO MOTORISTA PERIODICAMENTE

import apiService from './services/apiService';

/**
 * Solicita a localização do motorista periodicamente
 * @param {string} driverId - ID do motorista
 * @param {string} rideId - ID da corrida
 * @param {function} onLocationUpdate - Callback quando receber localização
 */
export function startDriverLocationTracking(driverId, rideId, onLocationUpdate) {
  console.log('📍 Iniciando rastreamento do motorista:', driverId);
  
  let trackingInterval = null;
  let isTracking = true;
  
  // Função para solicitar localização
  const requestLocation = () => {
    if (!isTracking) return;
    
    console.log('📡 Solicitando localização do motorista...');
    
    // Emitir evento solicitando localização
    if (apiService.socket && apiService.socket.connected) {
      apiService.socket.emit('request_driver_location', {
        driverId: driverId,
        rideId: rideId,
        timestamp: Date.now()
      });
    }
    
    // Fazer requisição HTTP como fallback
    fetch(`${apiService.API_BASE_URL}/rides/${rideId}/driver-location`)
      .then(response => response.json())
      .then(data => {
        if (data.location) {
          console.log('📍 Localização recebida via HTTP:', data.location);
          onLocationUpdate(data.location);
        }
      })
      .catch(error => {
        console.error('❌ Erro ao obter localização:', error);
      });
  };
  
  // Solicitar localização imediatamente
  requestLocation();
  
  // Solicitar a cada 5 segundos
  trackingInterval = setInterval(requestLocation, 5000);
  
  // Retornar função para parar o rastreamento
  return () => {
    console.log('🛑 Parando rastreamento do motorista');
    isTracking = false;
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }
  };
}

/**
 * Simula localização do motorista se movendo em direção ao passageiro
 * Útil para testes quando a API não fornece localização real
 */
export function simulateDriverMovement(passengerLat, passengerLng, onLocationUpdate) {
  console.log('🎮 Iniciando simulação de movimento do motorista');
  
  // Posição inicial do motorista (1km de distância)
  let currentLat = passengerLat + 0.01;
  let currentLng = passengerLng + 0.01;
  
  const simulationInterval = setInterval(() => {
    // Mover motorista em direção ao passageiro
    const latDiff = passengerLat - currentLat;
    const lngDiff = passengerLng - currentLng;
    
    // Calcular distância
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // Se chegou muito perto, parar
    if (distance < 0.0005) { // ~50 metros
      console.log('✅ Motorista chegou (simulação)');
      clearInterval(simulationInterval);
      return;
    }
    
    // Mover 10% da distância a cada atualização
    currentLat += latDiff * 0.1;
    currentLng += lngDiff * 0.1;
    
    // Adicionar um pouco de variação aleatória para parecer mais real
    currentLat += (Math.random() - 0.5) * 0.0001;
    currentLng += (Math.random() - 0.5) * 0.0001;
    
    const newLocation = {
      lat: currentLat,
      lng: currentLng,
      latitude: currentLat,
      longitude: currentLng,
      timestamp: Date.now()
    };
    
    console.log('📍 [SIMULAÇÃO] Nova localização:', newLocation);
    onLocationUpdate(newLocation);
    
  }, 3000); // Atualizar a cada 3 segundos
  
  // Retornar função para parar simulação
  return () => {
    clearInterval(simulationInterval);
  };
}

export default {
  startDriverLocationTracking,
  simulateDriverMovement
};