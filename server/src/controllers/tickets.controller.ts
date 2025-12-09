import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
} from '../services/tickets.service.js';
import { z } from 'zod';

const createTicketSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']),
  category: z.enum(['tecnico', 'suporte', 'financeiro', 'outros']),
  serviceType: z.string().optional(),
  totalValue: z.number().optional(),
  clientId: z.string().uuid().optional(),
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    dataUrl: z.string(),
  })).optional(),
});

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['aberto', 'em_andamento', 'em_atendimento', 'pendente', 'resolvido', 'fechado', 'encerrado']).optional(),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  category: z.enum(['tecnico', 'suporte', 'financeiro', 'outros']).optional(),
  serviceType: z.string().optional(),
  totalValue: z.number().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  clientId: z.string().uuid().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Conteúdo do comentário é obrigatório'),
});

export const getAllTicketsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;
    if (req.query.createdBy) filters.createdBy = req.query.createdBy;
    if (req.query.search) filters.search = req.query.search;

    // If user is not admin, filter by their own tickets
    if (req.user?.role === 'user') {
      filters.createdBy = req.user.id;
    } else if (req.user?.role === 'technician') {
      filters.assignedTo = req.user.id;
    }

    const tickets = await getAllTickets(filters);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getTicketByIdController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await getTicketById(req.params.id);

    // Check permissions
    if (req.user?.role === 'user' && ticket.created_by_user.id !== req.user.id) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const createTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const validated = createTicketSchema.parse(req.body);
    const ticket = await createTicket({
      ...validated,
      createdBy: req.user.id,
      clientId: validated.clientId || req.user.id,
    });
    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = updateTicketSchema.parse(req.body);
    const ticket = await updateTicket(req.params.id, validated);
    res.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteTicket(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const addCommentController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const validated = commentSchema.parse(req.body);
    const comment = await addComment(req.params.id, req.user.id, validated.content);
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

