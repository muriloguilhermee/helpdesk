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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS Configuration - suporta múltiplas origens separadas por vírgula
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim().replace(/\/$/, '')) // Remove barra no final
  : ['http://localhost:5173'];

// CORS Configuration - melhorado para garantir funcionamento
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (health check, mobile apps, Postman, etc)
    if (!origin) {
      console.log('✅ CORS: Requisição sem origin permitida');
      return callback(null, true);
    }
    
    // Normalizar origin (remover barra no final e converter para lowercase)
    const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
    const normalizedAllowed = corsOrigins.map(o => o.replace(/\/$/, '').toLowerCase());
    
    // Log para debug
    console.log(`🔍 CORS check - Origin recebida: ${origin}`);
    console.log(`🔍 CORS check - Origin normalizada: ${normalizedOrigin}`);
    console.log(`🔍 CORS check - Origins permitidas: ${normalizedAllowed.join(', ')}`);
    
    // Verificar se a origin está na lista permitida
    const isAllowed = normalizedAllowed.some(allowed => allowed === normalizedOrigin);
    
    if (isAllowed) {
      console.log(`✅ CORS: Origin permitida: ${normalizedOrigin}`);
      callback(null, true);
    } else {
      // Em produção, se não estiver na lista, bloquear
      if (process.env.NODE_ENV === 'production') {
        console.error(`❌ CORS bloqueado: ${normalizedOrigin} não está na lista permitida`);
        console.error(`   Origins configuradas: ${corsOrigins.join(', ')}`);
        callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
      } else {
        // Em desenvolvimento, permitir tudo
        console.log(`⚠️  CORS: Origin não configurada, mas permitindo (modo desenvolvimento): ${normalizedOrigin}`);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
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

