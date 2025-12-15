import { Request, Response } from 'express';
import { login, register } from '../services/auth.service.js';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'technician', 'user']),
  avatar: z.string().optional(),
});

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await login(validated);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(401).json({ error: (error as Error).message });
  }
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await register(validated);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

