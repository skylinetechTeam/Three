const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('rate-limiter-flexible');

// Import routes
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/drivers');
const passengerRoutes = require('./routes/passengers');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const validateRequest = require('./middleware/validation');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyStore: new Map(),
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Try again later.'
    });
  }
});

// Store active connections
const activeConnections = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  
  // Register user type (driver or passenger)
  socket.on('register', (data) => {
    const { userType, userId } = data;
    activeConnections.set(socket.id, { userType, userId, socketId: socket.id });
    socket.join(userType); // Join room based on user type
    console.log(`👤 Usuário registrado: ${userType} - ${userId} (Socket: ${socket.id})`);
    console.log(`📊 Total de conexões ativas: ${activeConnections.size}`);
    
    // Log das conexões por tipo
    const drivers = Array.from(activeConnections.values()).filter(conn => conn.userType === 'driver');
    const passengers = Array.from(activeConnections.values()).filter(conn => conn.userType === 'passenger');
    console.log(`🚗 Motoristas conectados: ${drivers.length}`);
    console.log(`👥 Passageiros conectados: ${passengers.length}`);
  });
  
  // Handle location updates
  socket.on('location_update', (data) => {
    const { userId, location, userType } = data;
    
    // Broadcast location to relevant users
    if (userType === 'driver') {
      socket.broadcast.to('passenger').emit('driver_location', {
        driverId: userId,
        location: location
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
    activeConnections.delete(socket.id);
  });
});

// Make io available to routes
app.set('io', io);
app.set('activeConnections', activeConnections);

// API Routes
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/passengers', passengerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeConnections: activeConnections.size
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Taxi API',
    version: '1.0.0',
    description: 'API para gerenciamento de solicitações de corrida',
    endpoints: {
      rides: {
        'POST /api/rides/request': 'Criar nova solicitação de corrida',
        'GET /api/rides': 'Listar todas as corridas',
        'GET /api/rides/:id': 'Obter detalhes de uma corrida',
        'PUT /api/rides/:id/accept': 'Aceitar corrida (motorista)',
        'PUT /api/rides/:id/reject': 'Rejeitar corrida (motorista)',
        'PUT /api/rides/:id/start': 'Iniciar corrida',
        'PUT /api/rides/:id/complete': 'Finalizar corrida',
        'PUT /api/rides/:id/cancel': 'Cancelar corrida'
      },
      drivers: {
        'POST /api/drivers/register': 'Registrar motorista',
        'PUT /api/drivers/:id/status': 'Atualizar status online/offline',
        'GET /api/drivers/nearby': 'Buscar motoristas próximos'
      },
      passengers: {
        'POST /api/passengers/register': 'Registrar passageiro',
        'GET /api/passengers/:id/rides': 'Histórico de corridas do passageiro'
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Socket.IO habilitado para atualizações em tempo real`);
  console.log(`🌐 API disponível em: http://172.30.0.2:${PORT}/api`);
  console.log(`❤️ Health check: http://172.30.0.2:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    process.exit(0);
  });
});

module.exports = { app, io };