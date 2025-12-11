import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import filesRoutes from './routes/files.routes.js';
import financialRoutes from './routes/financial.routes.js';
import { initializeDatabase } from './database/connection.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS Configuration - DEVE vir ANTES de tudo
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

console.log('🌐 CORS Origins configuradas:', corsOrigins);

// CORS simplificado e robusto
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    const normalizedAllowed = corsOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
    const isAllowed = normalizedAllowed.includes(normalizedOrigin);
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.header('Access-Control-Max-Age', '86400');
    }
  }
  
  // Responder imediatamente a OPTIONS
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// CORS middleware adicional (backup)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    const normalizedAllowed = corsOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
    const isAllowed = normalizedAllowed.includes(normalizedOrigin);
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
}));

// Security Middlewares - DEPOIS do CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging middleware para debug
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`🔍 OPTIONS request - Origin: ${req.headers.origin || 'N/A'}`);
  }
  next();
});

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/financial', financialRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Database and Start Server
// Servidor só inicia se banco conectar com sucesso
initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`✅ Server ready to accept connections`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

