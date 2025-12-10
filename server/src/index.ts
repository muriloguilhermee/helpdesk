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

// Security Middlewares
app.use(helmet());

// CORS Configuration - suporta múltiplas origens separadas por vírgula
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (health check, mobile apps, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se a origin está na lista permitida
    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Em produção, logar mas não bloquear (para debug)
      if (process.env.NODE_ENV === 'production') {
        console.warn(`⚠️  CORS: Origin não permitida: ${origin}`);
      }
      // Permitir em desenvolvimento, bloquear em produção se configurado
      if (process.env.NODE_ENV === 'development' || corsOrigins.length === 0) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database status (será atualizado após inicialização)
let dbInitialized = false;

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbInitialized ? 'connected' : 'disconnected'
  });
});

// Status endpoint (mais detalhado)
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbInitialized,
      configured: !!(process.env.DATABASE_URL || process.env.DB_HOST)
    },
    port: PORT
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
// Iniciar servidor mesmo se banco falhar (para permitir health check)
initializeDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('✅ Database initialized successfully');
  })
  .catch((error) => {
    console.error('⚠️  Database initialization failed:', error.message);
    console.error('⚠️  Server will start but database operations will fail');
    console.error('⚠️  Check DATABASE_URL in Railway variables');
    dbInitialized = false;
  })
  .finally(() => {
    // Sempre iniciar o servidor, mesmo se banco falhar
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`💾 Database: ${dbInitialized ? '✅ Connected' : '❌ Not connected'}`);
      console.log(`✅ Server ready to accept connections`);
      
      if (!dbInitialized) {
        console.error('');
        console.error('⚠️  ============================================');
        console.error('⚠️  ATENÇÃO: Banco de dados não conectado!');
        console.error('⚠️  ============================================');
        console.error('');
        console.error('O servidor está rodando, mas operações de banco falharão.');
        console.error('Verifique:');
        console.error('  1. DATABASE_URL está configurado no Railway');
        console.error('  2. Connection string está correta (sem [SENHA])');
        console.error('  3. Senha do banco está correta');
        console.error('');
      }
    });
  });

