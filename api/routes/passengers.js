const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// In-memory storage para passageiros
let passengers = [];

// Validation schemas
const passengerRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
  email: Joi.string().email().optional(),
  preferredPaymentMethod: Joi.string().valid('cash', 'card', 'digital').default('cash')
});

// POST /api/passengers/register - Registrar novo passageiro
router.post('/register', async (req, res) => {
  try {
    console.log('👤 Novo passageiro se registrando:', req.body);
    
    const { error, value } = passengerRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message,
        details: error.details
      });
    }

    // Verificar se passageiro já existe
    const existingPassenger = passengers.find(p => p.phone === value.phone);

    if (existingPassenger) {
      return res.status(409).json({
        error: 'Passenger already exists',
        message: 'Passageiro já cadastrado com este telefone'
      });
    }

    const passenger = {
      id: uuidv4(),
      ...value,
      rating: 5.0,
      totalRides: 0,
      totalSpent: 0,
      favoriteLocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    passengers.push(passenger);
    console.log(`✅ Passageiro ${passenger.name} registrado com sucesso`);

    res.status(201).json({
      success: true,
      message: 'Passageiro registrado com sucesso',
      data: {
        passengerId: passenger.id,
        passenger: {
          id: passenger.id,
          name: passenger.name,
          phone: passenger.phone,
          preferredPaymentMethod: passenger.preferredPaymentMethod,
          rating: passenger.rating
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao registrar passageiro:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/passengers/:id - Obter perfil do passageiro
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const passenger = passengers.find(p => p.id === id);
    
    if (!passenger) {
      return res.status(404).json({
        error: 'Passenger not found',
        message: 'Passageiro não encontrado'
      });
    }

    res.json({
      success: true,
      data: passenger
    });

  } catch (error) {
    console.error('❌ Erro ao buscar passageiro:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar passageiro'
    });
  }
});

// GET /api/passengers/:id/rides - Histórico de corridas do passageiro
router.get('/:id/rides', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0, status } = req.query;
    
    const passenger = passengers.find(p => p.id === id);
    
    if (!passenger) {
      return res.status(404).json({
        error: 'Passenger not found',
        message: 'Passageiro não encontrado'
      });
    }

    // Buscar corridas do passageiro (isso seria feito via RideService em um app real)
    const RideService = require('../services/rideService');
    const filters = { passengerId: id };
    if (status) filters.status = status;
    
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
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar histórico de corridas'
    });
  }
});

// PUT /api/passengers/:id/favorites - Adicionar local favorito
router.put('/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, lat, lng } = req.body;

    const favoriteSchema = Joi.object({
      name: Joi.string().min(1).max(50).required(),
      address: Joi.string().required(),
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    });

    const { error } = favoriteSchema.validate({ name, address, lat, lng });
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const passengerIndex = passengers.findIndex(p => p.id === id);
    
    if (passengerIndex === -1) {
      return res.status(404).json({
        error: 'Passenger not found',
        message: 'Passageiro não encontrado'
      });
    }

    const favorite = {
      id: uuidv4(),
      name,
      address,
      lat,
      lng,
      createdAt: new Date().toISOString()
    };

    passengers[passengerIndex].favoriteLocations.push(favorite);
    passengers[passengerIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Local favorito adicionado',
      data: favorite
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar favorito:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao adicionar local favorito'
    });
  }
});

// DELETE /api/passengers/:id/favorites/:favoriteId - Remover local favorito
router.delete('/:id/favorites/:favoriteId', async (req, res) => {
  try {
    const { id, favoriteId } = req.params;
    
    const passengerIndex = passengers.findIndex(p => p.id === id);
    
    if (passengerIndex === -1) {
      return res.status(404).json({
        error: 'Passenger not found',
        message: 'Passageiro não encontrado'
      });
    }

    const favoriteIndex = passengers[passengerIndex].favoriteLocations.findIndex(
      f => f.id === favoriteId
    );

    if (favoriteIndex === -1) {
      return res.status(404).json({
        error: 'Favorite not found',
        message: 'Local favorito não encontrado'
      });
    }

    passengers[passengerIndex].favoriteLocations.splice(favoriteIndex, 1);
    passengers[passengerIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Local favorito removido'
    });

  } catch (error) {
    console.error('❌ Erro ao remover favorito:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao remover local favorito'
    });
  }
});

// Helper function para calcular distância
function calculateDistance(lat1, lng1, lat2, lng2) {
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

module.exports = router;