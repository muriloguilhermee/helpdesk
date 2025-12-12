import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  addInteraction,
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
  status: z.enum(['aberto', 'em_andamento', 'em_atendimento', 'pendente', 'resolvido', 'fechado', 'encerrado', 'em_fase_de_testes', 'homologacao', 'aguardando_cliente']).optional(),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  category: z.enum(['tecnico', 'suporte', 'financeiro', 'outros']).optional(),
  serviceType: z.string().optional(),
  totalValue: z.number().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  clientId: z.string().uuid().optional(),
  queueId: z.string().uuid().nullable().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Conteúdo do comentário é obrigatório'),
});

export const getAllTicketsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('========================================');
    console.log('📥 REQUISIÇÃO GET /api/tickets RECEBIDA');
    console.log('========================================');
    console.log('👤 Usuário:', req.user?.email);
    console.log('🔑 Role:', req.user?.role);
    console.log('🔍 Query params:', req.query);
    console.log('🆔 User ID:', req.user?.id);

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
      console.log('👤 Filtro aplicado: apenas tickets do usuário');
    } else if (req.user?.role === 'technician') {
      // Técnicos devem ver TODOS os tickets (atribuídos a eles OU não atribuídos)
      // Não aplicar filtro de assignedTo aqui - deixar o frontend filtrar
      // Isso permite que técnicos vejam tickets novos (não atribuídos) e seus próprios tickets
      console.log('🔧 Técnico: retornando TODOS os tickets (sem filtro)');
    } else if (req.user?.role === 'admin') {
      console.log('👑 Admin: retornando TODOS os tickets');
    }

    console.log('🔄 Chamando getAllTickets com filtros:', filters);
    const tickets = await getAllTickets(filters);

    // Log detalhado dos tickets retornados
    console.log('========================================');
    console.log(`✅ RESPOSTA: ${tickets.length} tickets retornados para ${req.user?.role}`);
    console.log('========================================');
    console.log('📊 Estatísticas:', {
      total: tickets.length,
      abertos: tickets.filter((t: any) => t.status === 'aberto').length,
      em_atendimento: tickets.filter((t: any) => t.status === 'em_atendimento').length,
      atribuidos: tickets.filter((t: any) => t.assigned_to_user).length,
      nao_atribuidos: tickets.filter((t: any) => !t.assigned_to_user).length,
    });
    console.log('📋 IDs dos tickets:', tickets.map((t: any) => t.id));
    console.log('📋 Detalhes:', tickets.map((t: any) => ({
      id: t.id,
      status: t.status,
      assigned: !!t.assigned_to_user,
      created_by: t.created_by,
      created_by_user: t.created_by_user ? 'existe' : 'null'
    })));
    console.log('========================================');

    res.json(tickets);
  } catch (error) {
    console.error('❌ Erro ao buscar tickets:', error);
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
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      category: validated.category,
      createdBy: req.user.id,
      clientId: validated.clientId || req.user.id,
      serviceType: validated.serviceType,
      totalValue: validated.totalValue,
      queueId: validated.queueId,
      files: validated.files ? validated.files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: file.dataUrl,
      })) : undefined,
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
    const ticket = await updateTicket(req.params.id, validated);
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

const interactionSchema = z.object({
  type: z.string().min(1, 'Tipo da interação é obrigatório'),
  content: z.string().min(1, 'Conteúdo da interação é obrigatório'),
  metadata: z.any().optional(),
});

export const addInteractionController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const validated = interactionSchema.parse(req.body);
    const interaction = await addInteraction(
      req.params.id,
      req.user.id,
      validated.type,
      validated.content,
      validated.metadata
    );
    res.status(201).json(interaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
};

