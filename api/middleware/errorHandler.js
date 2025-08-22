// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error occurred:', err);

  // Default error
  let error = {
    statusCode: 500,
    message: 'Erro interno do servidor'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: `Erro de validação: ${message}`
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      statusCode: 409,
      message: `${field} já existe no sistema`
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Token inválido'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expirado'
    };
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'ID inválido'
    };
  }

  // Custom error
  if (err.statusCode) {
    error = {
      statusCode: err.statusCode,
      message: err.message
    };
  }

  res.status(error.statusCode).json({
    error: true,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;