import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  body: any;
  params: any;
  query: any;
  headers: any;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Middleware de autenticação:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'null'
    });

    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('❌ Token não fornecido no header Authorization');
      console.error('   Headers recebidos:', Object.keys(req.headers));
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      role: string;
    };

    console.log('✅ Token válido, usuário autenticado:', {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role
    });

    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('❌ Erro ao verificar token:', {
      error: error.message,
      path: req.path,
      method: req.method
    });
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    next();
  };
};

