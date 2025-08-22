const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// In-memory storage (em produção, use um banco de dados real)
let rides = [];
let drivers = [];
let passengers = [];

class RideService {
  
  // Criar nova corrida
  static async createRide(rideData) {
    try {
      const ride = {
        id: rideData.id || uuidv4(),
        passengerId: rideData.passengerId,
        passengerName: rideData.passengerName,
        passengerPhone: rideData.passengerPhone,
        pickup: rideData.pickup,
        destination: rideData.destination,
        estimatedFare: rideData.estimatedFare,
        estimatedDistance: rideData.estimatedDistance,
        estimatedTime: rideData.estimatedTime,
        paymentMethod: rideData.paymentMethod || 'cash',
        notes: rideData.notes,
        vehicleType: rideData.vehicleType || 'standard',
        status: 'pending',
        requestTime: rideData.requestTime || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Campos que serão preenchidos posteriormente
        driverId: null,
        driverName: null,
        driverPhone: null,
        vehicleInfo: null,
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        actualFare: null,
        actualDistance: null,
        actualTime: null,
        cancelReason: null,
        cancelledBy: null,
        driverLocation: null
      };

      rides.push(ride);
      console.log(`✅ Corrida ${ride.id} criada com sucesso`);
      
      return ride;
    } catch (error) {
      console.error('❌ Erro ao criar corrida:', error);
      throw error;
    }
  }

  // Buscar corridas com filtros
  static async getRides(filters = {}, limit = 20, offset = 0) {
    try {
      let filteredRides = [...rides];

      // Aplicar filtros
      if (filters.status) {
        filteredRides = filteredRides.filter(ride => ride.status === filters.status);
      }
      
      if (filters.driverId) {
        filteredRides = filteredRides.filter(ride => ride.driverId === filters.driverId);
      }
      
      if (filters.passengerId) {
        filteredRides = filteredRides.filter(ride => ride.passengerId === filters.passengerId);
      }
      
      if (filters.startDate) {
        const startDate = moment(filters.startDate);
        filteredRides = filteredRides.filter(ride => 
          moment(ride.createdAt).isAfter(startDate)
        );
      }
      
      if (filters.endDate) {
        const endDate = moment(filters.endDate);
        filteredRides = filteredRides.filter(ride => 
          moment(ride.createdAt).isBefore(endDate)
        );
      }

      // Ordenar por data de criação (mais recentes primeiro)
      filteredRides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Aplicar paginação
      const paginatedRides = filteredRides.slice(offset, offset + limit);

      return paginatedRides;
    } catch (error) {
      console.error('❌ Erro ao buscar corridas:', error);
      throw error;
    }
  }

  // Buscar corrida por ID
  static async getRideById(rideId) {
    try {
      const ride = rides.find(r => r.id === rideId);
      return ride || null;
    } catch (error) {
      console.error('❌ Erro ao buscar corrida por ID:', error);
      throw error;
    }
  }

  // Aceitar corrida
  static async acceptRide(rideId, driverData) {
    try {
      const rideIndex = rides.findIndex(r => r.id === rideId);
      
      if (rideIndex === -1) {
        return null;
      }

      const ride = rides[rideIndex];
      
      // Verificar se a corrida ainda está pendente
      if (ride.status !== 'pending') {
        return null;
      }

      // Atualizar dados da corrida
      rides[rideIndex] = {
        ...ride,
        status: 'accepted',
        driverId: driverData.driverId,
        driverName: driverData.driverName,
        driverPhone: driverData.driverPhone,
        vehicleInfo: driverData.vehicleInfo,
        acceptedAt: driverData.acceptedAt,
        updatedAt: new Date().toISOString()
      };

      console.log(`✅ Corrida ${rideId} aceita pelo motorista ${driverData.driverName}`);
      
      return rides[rideIndex];
    } catch (error) {
      console.error('❌ Erro ao aceitar corrida:', error);
      throw error;
    }
  }

  // Rejeitar corrida
  static async rejectRide(rideId, driverId, reason) {
    try {
      const ride = rides.find(r => r.id === rideId);
      
      if (!ride) {
        return null;
      }

      // Log da rejeição (não remove a corrida, apenas registra)
      console.log(`❌ Corrida ${rideId} rejeitada pelo motorista ${driverId}. Motivo: ${reason || 'Não especificado'}`);
      
      return { rideId, status: 'rejected', driverId, reason };
    } catch (error) {
      console.error('❌ Erro ao rejeitar corrida:', error);
      throw error;
    }
  }

  // Iniciar corrida
  static async startRide(rideId, driverId, startData) {
    try {
      const rideIndex = rides.findIndex(r => r.id === rideId && r.driverId === driverId);
      
      if (rideIndex === -1) {
        return null;
      }

      const ride = rides[rideIndex];
      
      if (ride.status !== 'accepted') {
        return null;
      }

      rides[rideIndex] = {
        ...ride,
        status: 'in_progress',
        startedAt: startData.startedAt,
        actualPickupLocation: startData.actualPickupLocation,
        updatedAt: new Date().toISOString()
      };

      console.log(`🚀 Corrida ${rideId} iniciada`);
      
      return rides[rideIndex];
    } catch (error) {
      console.error('❌ Erro ao iniciar corrida:', error);
      throw error;
    }
  }

  // Finalizar corrida
  static async completeRide(rideId, driverId, completionData) {
    try {
      const rideIndex = rides.findIndex(r => r.id === rideId && r.driverId === driverId);
      
      if (rideIndex === -1) {
        return null;
      }

      const ride = rides[rideIndex];
      
      if (ride.status !== 'in_progress') {
        return null;
      }

      // Calcular tempo real da corrida
      const startTime = moment(ride.startedAt);
      const endTime = moment(completionData.completedAt);
      const actualTime = endTime.diff(startTime, 'minutes');

      rides[rideIndex] = {
        ...ride,
        status: 'completed',
        completedAt: completionData.completedAt,
        actualDropoffLocation: completionData.actualDropoffLocation,
        actualFare: completionData.actualFare,
        actualTime: actualTime,
        paymentConfirmed: completionData.paymentConfirmed,
        updatedAt: new Date().toISOString()
      };

      console.log(`🏁 Corrida ${rideId} finalizada`);
      
      return rides[rideIndex];
    } catch (error) {
      console.error('❌ Erro ao finalizar corrida:', error);
      throw error;
    }
  }

  // Cancelar corrida
  static async cancelRide(rideId, userId, userType, reason) {
    try {
      const rideIndex = rides.findIndex(r => r.id === rideId);
      
      if (rideIndex === -1) {
        return null;
      }

      const ride = rides[rideIndex];
      
      // Verificar se a corrida pode ser cancelada
      if (['completed', 'cancelled'].includes(ride.status)) {
        return null;
      }

      rides[rideIndex] = {
        ...ride,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: userType,
        cancelReason: reason,
        updatedAt: new Date().toISOString()
      };

      console.log(`❌ Corrida ${rideId} cancelada por ${userType}`);
      
      return rides[rideIndex];
    } catch (error) {
      console.error('❌ Erro ao cancelar corrida:', error);
      throw error;
    }
  }

  // Atualizar localização do motorista durante a corrida
  static async updateRideLocation(rideId, driverId, locationData) {
    try {
      const rideIndex = rides.findIndex(r => r.id === rideId && r.driverId === driverId);
      
      if (rideIndex === -1) {
        return null;
      }

      rides[rideIndex] = {
        ...rides[rideIndex],
        driverLocation: locationData,
        updatedAt: new Date().toISOString()
      };

      return rides[rideIndex];
    } catch (error) {
      console.error('❌ Erro ao atualizar localização:', error);
      throw error;
    }
  }

  // Buscar corridas pendentes próximas ao motorista
  static async getPendingRides(driverLocation = null, radiusKm = 10) {
    try {
      let pendingRides = rides.filter(ride => ride.status === 'pending');

      // Se localização do motorista fornecida, filtrar por proximidade
      if (driverLocation && driverLocation.lat && driverLocation.lng) {
        pendingRides = pendingRides.filter(ride => {
          const distance = this.calculateDistance(
            driverLocation.lat, 
            driverLocation.lng,
            ride.pickup.lat, 
            ride.pickup.lng
          );
          return distance <= radiusKm;
        });

        // Ordenar por proximidade
        pendingRides.sort((a, b) => {
          const distanceA = this.calculateDistance(
            driverLocation.lat, driverLocation.lng, a.pickup.lat, a.pickup.lng
          );
          const distanceB = this.calculateDistance(
            driverLocation.lat, driverLocation.lng, b.pickup.lat, b.pickup.lng
          );
          return distanceA - distanceB;
        });
      }

      // Adicionar distância do motorista para cada corrida
      if (driverLocation) {
        pendingRides = pendingRides.map(ride => ({
          ...ride,
          distanceFromDriver: this.calculateDistance(
            driverLocation.lat, driverLocation.lng, ride.pickup.lat, ride.pickup.lng
          ).toFixed(2)
        }));
      }

      return pendingRides;
    } catch (error) {
      console.error('❌ Erro ao buscar corridas pendentes:', error);
      throw error;
    }
  }

  // Calcular distância entre dois pontos (fórmula de Haversine)
  static calculateDistance(lat1, lng1, lat2, lng2) {
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

  // Obter estatísticas das corridas
  static async getRideStats(timeframe = '24h') {
    try {
      const now = moment();
      let startTime;
      
      switch (timeframe) {
        case '1h':
          startTime = now.clone().subtract(1, 'hour');
          break;
        case '24h':
          startTime = now.clone().subtract(24, 'hours');
          break;
        case '7d':
          startTime = now.clone().subtract(7, 'days');
          break;
        case '30d':
          startTime = now.clone().subtract(30, 'days');
          break;
        default:
          startTime = now.clone().subtract(24, 'hours');
      }

      const filteredRides = rides.filter(ride => 
        moment(ride.createdAt).isAfter(startTime)
      );

      const stats = {
        total: filteredRides.length,
        pending: filteredRides.filter(r => r.status === 'pending').length,
        accepted: filteredRides.filter(r => r.status === 'accepted').length,
        inProgress: filteredRides.filter(r => r.status === 'in_progress').length,
        completed: filteredRides.filter(r => r.status === 'completed').length,
        cancelled: filteredRides.filter(r => r.status === 'cancelled').length,
        totalRevenue: filteredRides
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.actualFare || r.estimatedFare), 0),
        averageFare: 0,
        averageTime: 0
      };

      const completedRides = filteredRides.filter(r => r.status === 'completed');
      if (completedRides.length > 0) {
        stats.averageFare = stats.totalRevenue / completedRides.length;
        stats.averageTime = completedRides.reduce((sum, r) => sum + (r.actualTime || r.estimatedTime), 0) / completedRides.length;
      }

      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      throw error;
    }
  }

  // Limpar corridas antigas (manutenção)
  static async cleanupOldRides(daysOld = 30) {
    try {
      const cutoffDate = moment().subtract(daysOld, 'days');
      const initialCount = rides.length;
      
      rides = rides.filter(ride => 
        moment(ride.createdAt).isAfter(cutoffDate)
      );
      
      const removedCount = initialCount - rides.length;
      console.log(`🧹 Limpeza concluída: ${removedCount} corridas antigas removidas`);
      
      return { removed: removedCount, remaining: rides.length };
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      throw error;
    }
  }

  // Obter todas as corridas (para debug)
  static async getAllRides() {
    return rides;
  }

  // Resetar dados (para testes)
  static async resetData() {
    rides = [];
    drivers = [];
    passengers = [];
    console.log('🔄 Dados resetados');
    return { message: 'Dados resetados com sucesso' };
  }
}

module.exports = RideService;