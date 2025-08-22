const Joi = require('joi');

// Middleware para validar solicitações de corrida
const validateRideRequest = (req, res, next) => {
  const schema = Joi.object({
    passengerId: Joi.string().required(),
    passengerName: Joi.string().min(2).max(100).required(),
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
    paymentMethod: Joi.string().valid('cash', 'card', 'digital').default('cash')
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }

  req.validatedData = value;
  next();
};

// Middleware para validar coordenadas
const validateCoordinates = (req, res, next) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      error: 'Missing coordinates',
      message: 'Latitude e longitude são obrigatórias'
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Latitude e longitude devem ser números válidos'
    });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      error: 'Invalid coordinate range',
      message: 'Coordenadas fora do intervalo válido'
    });
  }

  req.coordinates = { lat: latitude, lng: longitude };
  next();
};

// Middleware para validar IDs
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'ID inválido fornecido'
      });
    }

    next();
  };
};

// Middleware para validar paginação
const validatePagination = (req, res, next) => {
  const { limit = 20, offset = 0 } = req.query;
  
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);

  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    return res.status(400).json({
      error: 'Invalid limit',
      message: 'Limit deve ser um número entre 1 e 100'
    });
  }

  if (isNaN(parsedOffset) || parsedOffset < 0) {
    return res.status(400).json({
      error: 'Invalid offset',
      message: 'Offset deve ser um número não negativo'
    });
  }

  req.pagination = { limit: parsedLimit, offset: parsedOffset };
  next();
};

module.exports = {
  validateRideRequest,
  validateCoordinates,
  validateId,
  validatePagination
};