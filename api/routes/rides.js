const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Joi = require('joi');
const RideService = require('../services/rideService');
const { validateRideRequest } = require('../middleware/validation');

// Função de normalização de IDs
const normalizeId = (id) => {
  if (id === null || id === undefined) return null;
  return String(id).trim();
};

const router = express.Router();

// Função helper para notificação com retry
const notifyWithRetry = async (io, socketId, event, data, maxRetries = 3) => {
  console.log(`🔄 [RETRY] Tentando notificar ${event} para socket ${socketId}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const socket = io.sockets.sockets.get(socketId);
      
      if (socket && socket.connected) {
        console.log(`📡 [RETRY] Tentativa ${attempt}/${maxRetries} para ${event}`);
        
        // Enviar evento
        socket.emit(event, data);
        
        // Aguardar confirmação (implementar acknowledge no cliente)
        const confirmed = await new Promise((resolve) => {
          const ackEvent = `${event}_ack_${data.rideId || 'unknown'}`;
          
          const ackHandler = (ackData) => {
            console.log(`✅ [RETRY] Confirmação recebida para ${event}`);
            resolve(true);
          };
          
          socket.once(ackEvent, ackHandler);
          
          // Timeout para confirmação
          setTimeout(() => {
            socket.off(ackEvent, ackHandler);
            resolve(false);
          }, 1000);
        });
        
        if (confirmed) {
          console.log(`✅ [RETRY] Notificação ${event} entregue com sucesso na tentativa ${attempt}`);
          return true;
        } else {
          console.log(`⚠️ [RETRY] Sem confirmação para ${event} na tentativa ${attempt}`);
        }
      } else {
        console.log(`❌ [RETRY] Socket ${socketId} não conectado na tentativa ${attempt}`);
      }
      
      // Aguardar antes da próxima tentativa
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
      
    } catch (error) {
      console.error(`❌ [RETRY] Erro na tentativa ${attempt}:`, error);
    }
  }
  
  console.error(`😭 [RETRY] Falha ao notificar ${event} após ${maxRetries} tentativas`);
  return false;
};

// Validation schemas
const rideRequestSchema = Joi.object({
  passengerId: Joi.string().required(),
  passengerName: Joi.string().min(2).max(100).required(),
  passengerPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  pickup: Joi.object({
    address: Joi.string().required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required(),
  destination: Joi.object({
    address: Joi.string().required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required(),
  estimatedFare: Joi.number().min(0).required(),
  estimatedDistance: Joi.number().min(0).required(),
  estimatedTime: Joi.number().min(1).required(),
  paymentMethod: Joi.string().valid('cash', 'card', 'digital').default('cash'),
  notes: Joi.string().max(500).optional(),
  vehicleType: Joi.string().valid('standard', 'premium', 'xl').default('standard')
});

// POST /api/rides/request - Criar nova solicitação de corrida
router.post('/request', async (req, res) => {
  try {
    console.log('🚖 Nova solicitação de corrida recebida:', req.body);
    
    // Validate request
    const { error, value } = rideRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message,
        details: error.details
      });
    }

    // Create ride request
    const rideData = {
      id: uuidv4(),
      ...value,
      status: 'pending',
      requestTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save ride request
    const ride = await RideService.createRide(rideData);
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Notify all online drivers about new ride request
    io.to('driver').emit('new_ride_request', {
      rideId: ride.id,
      ride: ride,
      message: 'Nova solicitação de corrida disponível!'
    });
    
    console.log(`✅ Corrida ${ride.id} criada e notificada aos motoristas`);

    // Set timeout for ride request - if no driver accepts within 30 seconds
    setTimeout(async () => {
      try {
        // Check if ride is still pending
        const currentRide = await RideService.getRideById(ride.id);
        if (currentRide && currentRide.status === 'pending') {
          console.log(`⏰ Timeout para corrida ${ride.id} - nenhum motorista aceitou`);
          
          // Update ride status to expired
          await RideService.updateRideStatus(ride.id, 'expired');
          
          // Notify passenger that no drivers are available
          const activeConnections = req.app.get('activeConnections');
          let passengerNotified = false;
          
          if (activeConnections) {
            for (const [socketId, connection] of activeConnections.entries()) {
              if (connection.userType === 'passenger' && connection.userId === ride.passengerId) {
                console.log(`📤 Notificando passageiro ${ride.passengerId} - nenhum motorista disponível`);
                io.to(socketId).emit('no_drivers_available', {
                  rideId: ride.id,
                  message: 'Nenhum motorista disponível no momento',
                  timestamp: new Date().toISOString()
                });
                passengerNotified = true;
                break;
              }
            }
          }
          
          // Broadcast if specific passenger not found
          if (!passengerNotified) {
            io.to('passenger').emit('no_drivers_available', {
              rideId: ride.id,
              message: 'Nenhum motorista disponível no momento',
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro no timeout da corrida ${ride.id}:`, error);
      }
    }, 30000); // 30 seconds timeout

    res.status(201).json({
      success: true,
      message: 'Solicitação de corrida criada com sucesso',
      data: {
        rideId: ride.id,
        estimatedWaitTime: '2-5 minutos',
        ride: ride
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar solicitação:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor ao criar solicitação'
    });
  }
});

// GET /api/rides - Listar corridas (com filtros)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      driverId, 
      passengerId, 
      limit = 20, 
      offset = 0,
      startDate,
      endDate 
    } = req.query;

    const filters = {
      status,
      driverId,
      passengerId,
      startDate,
      endDate
    };

    const rides = await RideService.getRides(filters, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: rides,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: rides.length
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar corridas:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar corridas'
    });
  }
});

// GET /api/rides/pending - Obter corridas pendentes para motoristas
router.get('/pending', async (req, res) => {
  try {
    const { driverLocation, radius = 10 } = req.query; // radius in km
    
    let location = null;
    if (driverLocation) {
      try {
        location = JSON.parse(driverLocation);
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid location format',
          message: 'Formato de localização inválido'
        });
      }
    }

    const pendingRides = await RideService.getPendingRides(location, parseFloat(radius));
    
    res.json({
      success: true,
      data: pendingRides,
      count: pendingRides.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar corridas pendentes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar corridas pendentes'
    });
  }
});

// GET /api/rides/:id - Obter detalhes de uma corrida específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ride = await RideService.getRideById(id);
    
    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada'
      });
    }

    res.json({
      success: true,
      data: ride
    });

  } catch (error) {
    console.error('❌ Erro ao buscar corrida:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar detalhes da corrida'
    });
  }
});

// PUT /api/rides/:id/accept - Aceitar corrida (motorista)
router.put('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, driverName, driverPhone, vehicleInfo } = req.body;

    if (!driverId || !driverName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'driverId e driverName são obrigatórios'
      });
    }

    const ride = await RideService.acceptRide(id, {
      driverId,
      driverName,
      driverPhone,
      vehicleInfo,
      acceptedAt: new Date().toISOString()
    });

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada ou já foi aceita'
      });
    }

    // Get Socket.IO instance
    const io = req.app.get('io');
    const activeConnections = req.app.get('activeConnections');
    
    // Enhanced notification system with detailed logging
    console.log(`📤 SISTEMA DE NOTIFICAÇÃO: Iniciando notificação para passageiro ${ride.passengerId}`);
    console.log(`🔍 [DIAGNÓSTICO] Dados completos da corrida:`, {
      id: ride.id,
      passengerId: ride.passengerId,
      passengerIdType: typeof ride.passengerId,
      status: ride.status,
      pickup: ride.pickup,
      destination: ride.destination
    });
    console.log(`🚗 [DIAGNÓSTICO] Dados do motorista:`, { driverId, driverName, driverPhone, vehicleInfo });
    console.log(`🕰️ [DIAGNÓSTICO] Timestamp da aceitação: ${new Date().toISOString()}`);
    console.log(`🔌 [DIAGNÓSTICO] Total de conexões ativas: ${activeConnections?.size || 0}`);
    
    // Log de todas as conexões para debugging
    if (activeConnections && activeConnections.size > 0) {
      console.log('📋 [DIAGNÓSTICO] LISTAGEM DE CONEXÕES ATIVAS:');
      let connectionIndex = 1;
      for (const [socketId, connection] of activeConnections.entries()) {
        console.log(`  ${connectionIndex}. Socket: ${socketId} | Tipo: ${connection.userType} | UserID: ${connection.userId} | Registrado: ${connection.registered || false} | Timestamp: ${connection.registeredAt || 'N/A'}`);
        connectionIndex++;
      }
    } else {
      console.warn('⚠️ [DIAGNÓSTICO] Nenhuma conexão ativa encontrada!');
    }
    
    // Prepare notification data with enhanced information
    const notificationData = {
      rideId: ride.id,
      ride: {
        ...ride,
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      },
      driver: {
        id: driverId,
        name: driverName,
        phone: driverPhone,
        vehicleInfo: vehicleInfo || {},
        rating: 4.8 // Default rating
      },
      estimatedArrival: '5-10 minutos',
      message: `${driverName} aceitou sua solicitação e está a caminho!`,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📦 Dados da notificação preparados:`, JSON.stringify(notificationData, null, 2));
    
    // Sistema dual de notificação: específico + broadcast
    let passengerNotified = false;
    console.log(`🔍 Conexões ativas totais: ${activeConnections?.size || 0}`);
    
    if (activeConnections && activeConnections.size > 0) {
      // Log all active connections for debugging
      console.log('📋 LISTAGEM DE CONEXÕES ATIVAS:');
      for (const [socketId, connection] of activeConnections.entries()) {
        console.log(`  Socket: ${socketId} | Tipo: ${connection.userType} | UserID: ${connection.userId} | Registrado: ${connection.registered || false}`);
      }
      
      // Tentar encontrar o passageiro específico
      for (const [socketId, connection] of activeConnections.entries()) {
        // NORMALIZAÇÃO CRÍTICA: Comparar IDs como strings para evitar incompatibilidades
        const connectionUserId = normalizeId(connection.userId);
        const ridePassengerId = normalizeId(ride.passengerId);
        
        console.log(`🔍 Verificando conexão: Socket=${socketId}, UserType=${connection.userType}, UserID=${connectionUserId}, Target=${ridePassengerId}`);
        console.log(`🔍 [DEBUG] Comparação exata: "${connectionUserId}" === "${ridePassengerId}" ? ${connectionUserId === ridePassengerId}`);
        
        if (connection.userType === 'passenger' && connectionUserId === ridePassengerId) {
          console.log(`✅ PASSAGEIRO ENCONTRADO: ${socketId}`);
          console.log(`📤 Enviando ride_accepted para socket específico ${socketId}`);
          
          try {
            // VALIDAÇÃO CRÍTICA: Verificar se socket está realmente conectado
            const socketInstance = io.sockets.sockets.get(socketId);
            if (socketInstance && socketInstance.connected) {
              console.log(`✅ Socket ${socketId} está conectado e ativo`);
              
              // Enviar para socket específico com retry
              const notified = await notifyWithRetry(io, socketId, 'ride_accepted', notificationData);
              
              if (notified) {
                console.log(`✅ NOTIFICAÇÃO ESPECÍFICA ENVIADA com sucesso para ${socketId}`);
                passengerNotified = true;
              } else {
                console.log(`⚠️ Falha ao notificar socket ${socketId} após todas as tentativas`);
              }
            } else {
              console.warn(`⚠️ Socket ${socketId} não está conectado ou ativo, removendo da lista`);
              
              // Remover conexão inválida da lista
              activeConnections.delete(socketId);
              console.log(`🗑️ Conexão inválida removida: ${socketId}`);
            }
          } catch (socketError) {
            console.error(`❌ Erro ao enviar para socket específico ${socketId}:`, socketError);
          }
          
          break;
        }
      }
    } else {
      console.warn('⚠️ Nenhuma conexão ativa encontrada ou activeConnections é null');
    }
    
    // Fallback: Broadcast para todos os passageiros se específico falhou
    if (!passengerNotified) {
      console.log(`⚠️ FALLBACK: Passageiro ${ride.passengerId} não encontrado ou notificação específica falhou`);
      console.log(`📡 Enviando broadcast para todos os passageiros...`);
      
      try {
        // Broadcast para sala de passageiros
        io.to('passenger').emit('ride_accepted', notificationData);
        console.log(`📡 BROADCAST ENVIADO para sala 'passenger'`);
        
        // Também tentar broadcast geral como último recurso
        io.emit('ride_accepted', {
          ...notificationData,
          broadcast: true,
          targetPassenger: ride.passengerId
        });
        console.log(`📢 BROADCAST GERAL ENVIADO como último recurso`);
        
      } catch (broadcastError) {
        console.error(`❌ Erro no broadcast:`, broadcastError);
      }
    }
    
    // Verificar quantos sockets estão na sala de passageiros
    const passengerSockets = io.sockets.adapter.rooms.get('passenger');
    console.log(`👥 Sockets na sala 'passenger': ${passengerSockets?.size || 0}`);
    if (passengerSockets && passengerSockets.size > 0) {
      console.log(`📋 Sockets na sala passenger:`, Array.from(passengerSockets));
    }

    // Notify other drivers that ride is no longer available
    console.log(`📢 Notificando outros motoristas que a corrida não está mais disponível`);
    io.to('driver').emit('ride_unavailable', {
      rideId: ride.id,
      message: 'Corrida já foi aceita por outro motorista',
      timestamp: new Date().toISOString()
    });

    // Log final do processo
    console.log(`✅ [DIAGNÓSTICO] PROCESSO COMPLETO: Corrida ${id} aceita pelo motorista ${driverName}`);
    console.log(`📊 [DIAGNÓSTICO] Status da notificação: ${passengerNotified ? 'ESPECÍFICA' : 'BROADCAST FALLBACK'}`);
    console.log(`🕰️ [DIAGNÓSTICO] Processamento concluído em: ${new Date().toISOString()}`);
    
    // Estatísticas de conexões por tipo
    if (activeConnections) {
      const drivers = Array.from(activeConnections.values()).filter(conn => conn.userType === 'driver');
      const passengers = Array.from(activeConnections.values()).filter(conn => conn.userType === 'passenger');
      console.log(`📊 [DIAGNÓSTICO] Estatísticas finais - Motoristas: ${drivers.length}, Passageiros: ${passengers.length}`);
    }

    res.json({
      success: true,
      message: 'Corrida aceita com sucesso',
      data: ride,
      notification: {
        method: passengerNotified ? 'specific' : 'broadcast',
        targetPassenger: ride.passengerId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao aceitar corrida:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao aceitar corrida',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/rides/:id/reject - Rejeitar corrida (motorista)
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, reason } = req.body;

    const ride = await RideService.rejectRide(id, driverId, reason);

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada'
      });
    }

    console.log(`❌ Corrida ${id} rejeitada pelo motorista ${driverId}`);

    // Get Socket.IO instance
    const io = req.app.get('io');
    const activeConnections = req.app.get('activeConnections');
    
    // Notify passenger that ride was rejected
    console.log(`📤 Notificando passageiro ${ride.passengerId} sobre corrida rejeitada`);
    
    // Try to notify the specific passenger via WebSocket
    let passengerNotified = false;
    if (activeConnections) {
      for (const [socketId, connection] of activeConnections.entries()) {
        if (connection.userType === 'passenger' && connection.userId === ride.passengerId) {
          console.log(`✅ Encontrado passageiro conectado para rejeição: ${socketId}`);
          io.to(socketId).emit('ride_rejected', {
            rideId: ride.id,
            ride: ride,
            driverId: driverId,
            reason: reason || 'Motorista não pode aceitar a solicitação no momento',
            timestamp: new Date().toISOString()
          });
          passengerNotified = true;
          break;
        }
      }
    }
    
    // If specific passenger not found, broadcast to all passengers
    if (!passengerNotified) {
      console.log(`⚠️ Passageiro ${ride.passengerId} não encontrado nas conexões ativas. Enviando broadcast de rejeição.`);
      io.to('passenger').emit('ride_rejected', {
        rideId: ride.id,
        ride: ride,
        driverId: driverId,
        reason: reason || 'Motorista não pode aceitar a solicitação no momento',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Corrida rejeitada',
      data: { rideId: id, status: 'rejected', reason: reason }
    });

  } catch (error) {
    console.error('❌ Erro ao rejeitar corrida:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao rejeitar corrida'
    });
  }
});

// PUT /api/rides/:id/start - Iniciar corrida (motorista chegou ao passageiro)
router.put('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, pickupLocation } = req.body;

    const ride = await RideService.startRide(id, driverId, {
      startedAt: new Date().toISOString(),
      actualPickupLocation: pickupLocation
    });

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada ou não pode ser iniciada'
      });
    }

    // Get Socket.IO instance
    const io = req.app.get('io');
    const activeConnections = req.app.get('activeConnections');
    
    // Notify passenger that ride has started
    console.log(`🚗 Notificando passageiro ${ride.passengerId} sobre início da corrida`);
    
    let passengerNotified = false;
    if (activeConnections) {
      for (const [socketId, connection] of activeConnections.entries()) {
        if (connection.userType === 'passenger' && connection.userId === ride.passengerId) {
          console.log(`✅ Encontrado passageiro conectado para início: ${socketId}`);
          io.to(socketId).emit('ride_started', {
            rideId: ride.id,
            ride: ride,
            message: 'Sua corrida foi iniciada!',
            estimatedArrival: Math.round(ride.estimatedTime / 60) + ' minutos',
            timestamp: new Date().toISOString()
          });
          passengerNotified = true;
          break;
        }
      }
    }
    
    // Fallback broadcast if specific passenger not found
    if (!passengerNotified) {
      console.log(`⚠️ Passageiro ${ride.passengerId} não encontrado. Enviando broadcast de início.`);
      io.to('passenger').emit('ride_started', {
        rideId: ride.id,
        ride: ride,
        message: 'Sua corrida foi iniciada!',
        estimatedArrival: Math.round(ride.estimatedTime / 60) + ' minutos',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🚀 Corrida ${id} iniciada`);

    res.json({
      success: true,
      message: 'Corrida iniciada com sucesso',
      data: ride
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar corrida:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao iniciar corrida'
    });
  }
});

// PUT /api/rides/:id/complete - Finalizar corrida
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, dropoffLocation, actualFare, paymentConfirmed } = req.body;

    const ride = await RideService.completeRide(id, driverId, {
      completedAt: new Date().toISOString(),
      actualDropoffLocation: dropoffLocation,
      actualFare: actualFare || ride.estimatedFare,
      paymentConfirmed: paymentConfirmed || false
    });

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada ou não pode ser finalizada'
      });
    }

    // Get Socket.IO instance
    const io = req.app.get('io');
    const activeConnections = req.app.get('activeConnections');
    
    // Notify passenger that ride is complete
    console.log(`✅ Notificando passageiro ${ride.passengerId} sobre conclusão da corrida`);
    
    let passengerNotified = false;
    if (activeConnections) {
      for (const [socketId, connection] of activeConnections.entries()) {
        if (connection.userType === 'passenger' && connection.userId === ride.passengerId) {
          console.log(`✅ Encontrado passageiro conectado para conclusão: ${socketId}`);
          io.to(socketId).emit('ride_completed', {
            rideId: ride.id,
            ride: ride,
            message: 'Corrida finalizada com sucesso!',
            fare: ride.actualFare || ride.estimatedFare,
            rating: true, // Request rating
            timestamp: new Date().toISOString()
          });
          passengerNotified = true;
          break;
        }
      }
    }
    
    // Fallback broadcast if specific passenger not found
    if (!passengerNotified) {
      console.log(`⚠️ Passageiro ${ride.passengerId} não encontrado. Enviando broadcast de conclusão.`);
      io.to('passenger').emit('ride_completed', {
        rideId: ride.id,
        ride: ride,
        message: 'Corrida finalizada com sucesso!',
        fare: ride.actualFare || ride.estimatedFare,
        rating: true, // Request rating
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🏁 Corrida ${id} finalizada`);

    res.json({
      success: true,
      message: 'Corrida finalizada com sucesso',
      data: ride
    });

  } catch (error) {
    console.error('❌ Erro ao finalizar corrida:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao finalizar corrida'
    });
  }
});

// PUT /api/rides/:id/cancel - Cancelar corrida
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType, reason } = req.body;

    const ride = await RideService.cancelRide(id, userId, userType, reason);

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada ou não pode ser cancelada'
      });
    }

    // Get Socket.IO instance
    const io = req.app.get('io');
    const activeConnections = req.app.get('activeConnections');
    
    // Notify relevant users about cancellation
    console.log(`❌ Notificando sobre cancelamento da corrida ${ride.id} por ${userType}`);
    
    // Determine who to notify based on who cancelled
    const targetUserType = userType === 'driver' ? 'passenger' : 'driver';
    const targetUserId = userType === 'driver' ? ride.passengerId : ride.driverId;
    
    let userNotified = false;
    if (activeConnections && targetUserId) {
      for (const [socketId, connection] of activeConnections.entries()) {
        if (connection.userType === targetUserType && connection.userId === targetUserId) {
          console.log(`✅ Encontrado ${targetUserType} conectado para cancelamento: ${socketId}`);
          io.to(socketId).emit('ride_cancelled', {
            rideId: ride.id,
            ride: ride,
            cancelledBy: userType,
            reason: reason,
            message: `Corrida cancelada pelo ${userType === 'driver' ? 'motorista' : 'passageiro'}`,
            timestamp: new Date().toISOString()
          });
          userNotified = true;
          break;
        }
      }
    }
    
    // Fallback broadcast if specific user not found
    if (!userNotified) {
      console.log(`⚠️ ${targetUserType} não encontrado. Enviando broadcast de cancelamento.`);
      io.to(targetUserType).emit('ride_cancelled', {
        rideId: ride.id,
        ride: ride,
        cancelledBy: userType,
        reason: reason,
        message: `Corrida cancelada pelo ${userType === 'driver' ? 'motorista' : 'passageiro'}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`❌ Corrida ${id} cancelada por ${userType}`);

    res.json({
      success: true,
      message: 'Corrida cancelada com sucesso',
      data: ride
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar corrida:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao cancelar corrida'
    });
  }
});

// PUT /api/rides/:id/location - Atualizar localização durante a corrida
router.put('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, location } = req.body;

    const locationSchema = Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      speed: Joi.number().min(0).optional(),
      heading: Joi.number().min(0).max(360).optional()
    });

    const { error } = locationSchema.validate(location);
    if (error) {
      return res.status(400).json({
        error: 'Invalid location data',
        message: error.details[0].message
      });
    }

    // Update ride with current location
    const ride = await RideService.updateRideLocation(id, driverId, {
      ...location,
      timestamp: new Date().toISOString()
    });

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        message: 'Corrida não encontrada'
      });
    }

    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Broadcast location update to passenger
    io.emit('driver_location_update', {
      rideId: ride.id,
      driverLocation: location,
      estimatedArrival: calculateETA(location, ride.destination)
    });

    res.json({
      success: true,
      message: 'Localização atualizada',
      data: { rideId: id, location }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar localização:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao atualizar localização'
    });
  }
});

// Helper function to calculate ETA
function calculateETA(currentLocation, destination) {
  // Simple distance calculation (you can improve this with real routing)
  const R = 6371; // Earth's radius in km
  const dLat = (destination.lat - currentLocation.lat) * Math.PI / 180;
  const dLng = (destination.lng - currentLocation.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  // Estimate time (assuming average speed of 30 km/h in city)
  const estimatedMinutes = Math.round((distance / 30) * 60);
  
  return estimatedMinutes;
}

module.exports = router;