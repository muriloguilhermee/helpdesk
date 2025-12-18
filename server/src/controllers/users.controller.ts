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
  role: z.enum(['admin', 'technician', 'technician_n2', 'user', 'financial']),
  avatar: z.string().optional(),
  company: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'technician', 'technician_n2', 'user', 'financial']).optional(),
  avatar: z.union([z.string(), z.null()]).optional(),
  company: z.union([z.string(), z.null()]).optional(),
});

export const getAllUsersController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await getAllUsers();
    // Debug: garantir que 'company' está vindo do banco
    if (Array.isArray(users) && users.length > 0) {
      // Usuários carregados
    }
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
    const errorMessage = (error as Error).message;
    res.status(400).json({ error: errorMessage });
  }
};

export const updateUserController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    const validated = updateUserSchema.parse(req.body);

    const user = await updateUser(req.params.id, validated);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => e.message).join(', ');
      res.status(400).json({ error: errorMessage });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteUserController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {


    // Não permitir que usuário exclua a si mesmo
    if (req.user?.id === req.params.id) {
      res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
      return;
    }

    await deleteUser(req.params.id);

    res.status(204).send();
  } catch (error) {
    const errorMessage = (error as Error).message;
    res.status(404).json({ error: errorMessage });
  }
};

