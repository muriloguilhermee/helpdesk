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
// Cloud Run costuma usar PORT=8080
const PORT = Number(process.env.PORT) || 3001;

// Trust proxy - necessário para rate limiting funcionar corretamente no Render
app.set('trust proxy', true);

// ============================================
// CORS - ABSOLUTAMENTE PRIMEIRO (CRÍTICO!)
// ============================================
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];


// Handler ABSOLUTO para OPTIONS - antes de qualquer middleware
app.options('*', (req, res) => {
  const origin = req.headers.origin;

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
      return res.status(204).end();
    }
  }

  // Sempre responder, mesmo sem origin
  res.status(204).end();
});

// Middleware CORS manual - PRIMEIRO, antes de qualquer coisa
app.use((req, res, next) => {
  const origin = req.headers.origin;

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

// Rate Limiting - EXCLUIR OPTIONS e ser mais permissivo para login
// validate: false desabilita a validação do trust proxy (necessário para Cloud Run)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Aumentado para 200 requisições por 15 minutos
  skip: (req) => req.method === 'OPTIONS', // Não aplicar rate limit em OPTIONS
  message: 'Muitas requisições. Aguarde alguns segundos e tente novamente.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Desabilita validação do trust proxy (Cloud Run precisa de trust proxy)
});

// Rate limiting mais permissivo para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 tentativas de login por 15 minutos
  message: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Desabilita validação do trust proxy
});

app.use('/api/', limiter);
app.use('/api/auth/login', loginLimiter);

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

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');
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

// Health check endpoint (antes de conectar ao banco)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Database and Start Server
// IMPORTANTE: Inicia o servidor PRIMEIRO, depois conecta ao banco em background
// Isso evita timeout no Cloud Run
const server = app.listen(PORT, '0.0.0.0', () => {





  // Conecta ao banco em background (não bloqueia o start)
  initializeDatabase()
    .then(() => {

    })
    .catch((error) => {
      console.error('❌ Failed to connect to database:', error);
      console.error('⚠️  Server will continue running, but database operations may fail');
    });
});

// Manter o servidor vivo
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Tratamento de erros do servidor (sem process.exit)
server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
});


