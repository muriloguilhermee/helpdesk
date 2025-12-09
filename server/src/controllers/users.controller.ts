import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../services/users.service.js';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'technician', 'user']),
  avatar: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'technician', 'user']).optional(),
  avatar: z.string().nullable().optional(),
});

export const getAllUsersController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUserByIdController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const createUserController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = createUserSchema.parse(req.body);
    const user = await createUser(validated);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateUserController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = updateUserSchema.parse(req.body);
    const user = await updateUser(req.params.id, validated);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteUserController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

