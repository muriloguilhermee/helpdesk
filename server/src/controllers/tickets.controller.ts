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
  queueId: z.string().uuid().optional(),
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
  status: z
    .enum([
      'aberto',
      'em_andamento',
      'em_atendimento',
      'pendente',
      'resolvido',
      'fechado',
      'encerrado',
      'em_fase_de_testes',
      'homologacao',
      'aguardando_cliente',
    ])
    .optional(),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  category: z.enum(['tecnico', 'suporte', 'financeiro', 'outros']).optional(),
  serviceType: z.string().optional(),
  totalValue: z.number().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  clientId: z.string().uuid().optional(),
  queueId: z.union([z.string().uuid(), z.string().min(1), z.null()]).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Conteúdo do comentário é obrigatório'),
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    data: z.string(),
  })).optional(),
});

export const getAllTicketsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📥 getAllTicketsController - Usuário:', req.user?.email, 'Role:', req.user?.role);
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;
    if (req.query.createdBy) filters.createdBy = req.query.createdBy;
    if (req.query.search) filters.search = req.query.search;

    // Apenas usuários comuns são filtrados por seus próprios tickets
    // Técnicos N2 veem APENAS tickets na fila "Suporte N2"
    // Técnicos e admins veem todos os tickets
    if (req.user?.role === 'user') {
      filters.createdBy = req.user.id;
    } else if (req.user?.role === 'technician_n2') {
      // Técnicos N2 veem APENAS tickets na fila "Suporte N2"
      // Filtrar por queue contendo "Suporte N2" ou "N2"
      filters.queue = 'Suporte N2'; // Será filtrado no service
    }
    // Técnicos e admins não têm filtro de atribuição - veem todos os tickets

    console.log('🔍 Filtros aplicados:', JSON.stringify(filters));
    const tickets = await getAllTickets(filters);
    console.log(`✅ Retornando ${tickets.length} tickets para ${req.user?.role || 'usuário não autenticado'}`);
    res.json(tickets);
  } catch (error) {
    console.error('❌ Erro em getAllTicketsController:', error);
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

    console.log('📥 Recebida requisição para criar ticket:', req.body);
    const validated = createTicketSchema.parse(req.body);
    const ticket = await createTicket({
      ...validated,
      createdBy: req.user.id,
      clientId: validated.clientId || req.user.id,
    });
    console.log('✅ Ticket criado, retornando resposta:', ticket.id);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('❌ Erro no controller de criação de ticket:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    const errorMessage = (error as Error).message;
    console.error('Mensagem de erro:', errorMessage);
    res.status(400).json({ error: errorMessage });
  }
};

export const updateTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📥 Recebida requisição para atualizar ticket:', req.params.id, req.body);
    const validated = updateTicketSchema.parse(req.body);
    // Adicionar ID do usuário que está fazendo a atualização
    const updateData = {
      ...validated,
      updatedBy: req.user?.id,
    };
    const ticket = await updateTicket(req.params.id, updateData);
    console.log('✅ Ticket atualizado, retornando resposta:', ticket.id);
    res.json(ticket);
  } catch (error) {
    console.error('❌ Erro no controller de atualização de ticket:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    const errorMessage = (error as Error).message;
    console.error('Mensagem de erro:', errorMessage);
    res.status(400).json({ error: errorMessage });
  }
};

export const deleteTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📥 Recebida requisição para excluir ticket:', req.params.id);
    await deleteTicket(req.params.id);
    console.log('✅ Ticket excluído com sucesso');
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro no controller de exclusão de ticket:', error);
    const errorMessage = (error as Error).message;
    res.status(404).json({ error: errorMessage });
  }
};

export const addCommentController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const validated = commentSchema.parse(req.body);
    const comment = await addComment(req.params.id, req.user.id, validated.content, validated.files);
    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

