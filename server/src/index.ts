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

// ============================================
// CORS - ABSOLUTAMENTE PRIMEIRO (CRÍTICO!)
// ============================================
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

console.log('🌐 CORS Origins configuradas:', corsOrigins);

// Handler ABSOLUTO para OPTIONS - antes de qualquer middleware
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`🔍 OPTIONS ABSOLUTO recebido - Origin: ${origin || 'N/A'}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Headers:`, req.headers);
  
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    const normalizedAllowed = corsOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
    const isAllowed = normalizedAllowed.includes(normalizedOrigin);
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Max-Age', '86400');
      console.log(`✅ OPTIONS ABSOLUTO respondido para: ${origin}`);
      return res.status(204).end();
    } else {
      console.error(`❌ OPTIONS ABSOLUTO bloqueado: ${normalizedOrigin}`);
    }
  }
  
  // Sempre responder, mesmo sem origin
  res.status(204).end();
});

// Middleware CORS manual - PRIMEIRO, antes de qualquer coisa
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log TODAS as requisições para debug
  if (req.method === 'OPTIONS' || req.path.includes('/api/')) {
    console.log(`📥 ${req.method} ${req.path} - Origin: ${origin || 'N/A'}`);
  }
  
  // Sempre adicionar headers CORS se houver origin
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    const normalizedAllowed = corsOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
    const isAllowed = normalizedAllowed.includes(normalizedOrigin);
    
    // Permitir se estiver na lista OU se não for produção
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      if (req.method === 'OPTIONS') {
        console.log(`✅ CORS middleware respondeu OPTIONS para: ${origin}`);
      }
    } else {
      console.error(`❌ CORS middleware bloqueou: ${normalizedOrigin}`);
    }
  }
  
  next();
});

// CORS middleware da biblioteca (backup)
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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

// Rate Limiting - EXCLUIR OPTIONS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'OPTIONS', // Não aplicar rate limit em OPTIONS
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Handler explícito para OPTIONS em todas as rotas da API
app.options('/api/*', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');
    console.log(`✅ OPTIONS handler explícito para: ${origin}`);
  }
  res.status(204).end();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Endpoint de teste CORS
app.get('/test-cors', (req, res) => {
  const origin = req.headers.origin;
  res.json({
    status: 'ok',
    origin: origin,
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
    },
    message: 'CORS test endpoint'
  });
});

app.options('/test-cors', (req, res) => {
  const origin = req.headers.origin;
  console.log(`🔍 TEST-CORS OPTIONS recebido - Origin: ${origin || 'N/A'}`);
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');
    console.log(`✅ TEST-CORS OPTIONS respondido para: ${origin}`);
  }
  res.status(204).end();
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
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`✅ Server ready to accept connections`);
      console.log(`🔗 Server listening on: http://0.0.0.0:${PORT}`);
    });

    // Tratamento de erros do servidor
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Unexpected server error:', error);
        process.exit(1);
      }
    });

    // Tratamento de requisições não tratadas
    server.on('request', (req: any, res) => {
      // Log para debug
      const path = req.url || req.path || 'unknown';
      if (req.method === 'OPTIONS' || path.includes('/api/')) {
        console.log(`📥 ${req.method} ${path} recebido`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => {
        process.exit(1);
      });
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });

