const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// In-memory storage para motoristas
let drivers = [];

// Validation schemas
const driverRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
  email: Joi.string().email().optional(),
  licenseNumber: Joi.string().min(5).max(20).required(),
  vehicleInfo: Joi.object({
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number().min(2000).max(2025).required(),
    color: Joi.string().required(),
    plate: Joi.string().required()
  }).required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional()
});

// POST /api/drivers/register - Registrar novo motorista
router.post('/register', async (req, res) => {
  try {
    console.log('👤 Novo motorista se registrando:', req.body);
    
    const { error, value } = driverRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message,
        details: error.details
      });
    }

    // Verificar se motorista já existe
    const existingDriver = drivers.find(d => 
      d.phone === value.phone || d.licenseNumber === value.licenseNumber
    );

    if (existingDriver) {
      return res.status(409).json({
        error: 'Driver already exists',
        message: 'Motorista já cadastrado com este telefone ou carteira de habilitação'
      });
    }

    const driver = {
      id: uuidv4(),
      ...value,
      isOnline: false,
      status: 'available', // available, busy, offline
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLocationUpdate: null
    };

    drivers.push(driver);
    console.log(`✅ Motorista ${driver.name} registrado com sucesso`);

    res.status(201).json({
      success: true,
      message: 'Motorista registrado com sucesso',
      data: {
        driverId: driver.id,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicleInfo: driver.vehicleInfo,
          rating: driver.rating
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao registrar motorista:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/drivers/:id/status - Atualizar status do motorista (online/offline)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline, location } = req.body;

    const driverIndex = drivers.findIndex(d => d.id === id);
    
    if (driverIndex === -1) {
      return res.status(404).json({
        error: 'Driver not found',
        message: 'Motorista não encontrado'
      });
    }

    // Atualizar status
    drivers[driverIndex] = {
      ...drivers[driverIndex],
      isOnline: isOnline,
      status: isOnline ? 'available' : 'offline',
      location: location || drivers[driverIndex].location,
      lastLocationUpdate: location ? new Date().toISOString() : drivers[driverIndex].lastLocationUpdate,
      updatedAt: new Date().toISOString()
    };

    console.log(`🔄 Status do motorista ${drivers[driverIndex].name} atualizado para: ${isOnline ? 'Online' : 'Offline'}`);

    res.json({
      success: true,
      message: `Status atualizado para ${isOnline ? 'online' : 'offline'}`,
      data: {
        driverId: id,
        isOnline: isOnline,
        status: drivers[driverIndex].status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao atualizar status'
    });
  }
});

// GET /api/drivers/nearby - Buscar motoristas próximos
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius em km

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude e longitude são obrigatórias'
      });
    }

    const passengerLat = parseFloat(lat);
    const passengerLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // Filtrar motoristas online e próximos
    const nearbyDrivers = drivers
      .filter(driver => 
        driver.isOnline && 
        driver.status === 'available' && 
        driver.location
      )
      .map(driver => {
        const distance = calculateDistance(
          passengerLat, 
          passengerLng, 
          driver.location.lat, 
          driver.location.lng
        );
        
        return {
          ...driver,
          distanceFromPassenger: distance.toFixed(2),
          estimatedArrival: Math.round((distance / 30) * 60) // Assumindo 30 km/h
        };
      })
      .filter(driver => driver.distanceFromPassenger <= searchRadius)
      .sort((a, b) => a.distanceFromPassenger - b.distanceFromPassenger)
      .slice(0, 10); // Máximo 10 motoristas

    res.json({
      success: true,
      data: nearbyDrivers,
      count: nearbyDrivers.length,
      searchRadius: searchRadius
    });

  } catch (error) {
    console.error('❌ Erro ao buscar motoristas próximos:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar motoristas próximos'
    });
  }
});

// GET /api/drivers/:id - Obter perfil do motorista
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = drivers.find(d => d.id === id);
    
    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        message: 'Motorista não encontrado'
      });
    }

    // Não retornar informações sensíveis
    const publicDriver = {
      id: driver.id,
      name: driver.name,
      vehicleInfo: driver.vehicleInfo,
      rating: driver.rating,
      totalRides: driver.totalRides,
      isOnline: driver.isOnline,
      status: driver.status
    };

    res.json({
      success: true,
      data: publicDriver
    });

  } catch (error) {
    console.error('❌ Erro ao buscar motorista:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar motorista'
    });
  }
});

// PUT /api/drivers/:id/location - Atualizar localização do motorista
router.put('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

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

    const driverIndex = drivers.findIndex(d => d.id === id);
    
    if (driverIndex === -1) {
      return res.status(404).json({
        error: 'Driver not found',
        message: 'Motorista não encontrado'
      });
    }

    drivers[driverIndex] = {
      ...drivers[driverIndex],
      location: location,
      lastLocationUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Localização atualizada',
      data: { driverId: id, location }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar localização:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao atualizar localização'
    });
  }
});

// GET /api/drivers - Listar todos os motoristas (admin)
router.get('/', async (req, res) => {
  try {
    const { status, isOnline, limit = 50, offset = 0 } = req.query;
    
    let filteredDrivers = [...drivers];
    
    if (status) {
      filteredDrivers = filteredDrivers.filter(d => d.status === status);
    }
    
    if (isOnline !== undefined) {
      filteredDrivers = filteredDrivers.filter(d => d.isOnline === (isOnline === 'true'));
    }

    // Paginação
    const paginatedDrivers = filteredDrivers.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedDrivers,
      pagination: {
        total: filteredDrivers.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar motoristas:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao listar motoristas'
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