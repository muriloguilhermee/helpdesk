import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  params: any;
  query: any;
  body: any;
  headers: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ Token não fornecido');
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      role: string;
    };

    console.log('🔐 Token decodificado - ID:', decoded.id, 'Email:', decoded.email, 'Role:', decoded.role);

    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Erro ao verificar token:', error);
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

