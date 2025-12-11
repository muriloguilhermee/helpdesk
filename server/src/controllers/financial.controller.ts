import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  getAllFinancialTickets,
  getFinancialTicketById,
  createFinancialTicket,
  updateFinancialTicket,
  deleteFinancialTicket,
} from '../services/financial.service.js';
import { z } from 'zod';

const createFinancialTicketSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().or(z.date()),
  paymentDate: z.string().or(z.date()).optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  clientId: z.string().uuid('ID do cliente inválido'),
  invoiceFile: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    data: z.string(),
  }).optional(),
  receiptFile: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    data: z.string(),
  }).optional(),
  notes: z.string().optional(),
  erpId: z.string().optional(),
  erpType: z.string().optional(),
  invoiceNumber: z.string().optional(),
  barcode: z.string().optional(),
  ourNumber: z.string().optional(),
  paymentErpId: z.string().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  erpMetadata: z.record(z.any()).optional(),
  paymentMetadata: z.record(z.any()).optional(),
});

const updateFinancialTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().or(z.date()).optional(),
  paymentDate: z.string().or(z.date()).optional().nullable(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  clientId: z.string().uuid().optional(),
  invoiceFile: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    data: z.string(),
  }).nullable().optional(),
  receiptFile: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    data: z.string(),
  }).nullable().optional(),
  notes: z.string().optional(),
  erpId: z.string().optional(),
  erpType: z.string().optional(),
  invoiceNumber: z.string().optional(),
  barcode: z.string().optional(),
  ourNumber: z.string().optional(),
  paymentErpId: z.string().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  erpMetadata: z.record(z.any()).optional(),
  paymentMetadata: z.record(z.any()).optional(),
});

export const getAllFinancialTicketsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tickets = await getAllFinancialTickets();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getFinancialTicketByIdController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await getFinancialTicketById(req.params.id);
    res.json(ticket);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const createFinancialTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    console.log('📥 Recebida requisição para criar ticket financeiro:', req.body);
    const validated = createFinancialTicketSchema.parse(req.body);

    const ticket = await createFinancialTicket({
      title: validated.title,
      description: validated.description,
      amount: validated.amount,
      dueDate: validated.dueDate instanceof Date ? validated.dueDate : new Date(validated.dueDate as string),
      paymentDate: validated.paymentDate ? (validated.paymentDate instanceof Date ? validated.paymentDate : new Date(validated.paymentDate as string)) : undefined,
      status: validated.status,
      clientId: validated.clientId,
      createdBy: req.user.id,
      invoiceFile: validated.invoiceFile ? {
        name: validated.invoiceFile.name,
        size: validated.invoiceFile.size,
        type: validated.invoiceFile.type,
        data: validated.invoiceFile.data,
      } : undefined,
      receiptFile: validated.receiptFile ? {
        name: validated.receiptFile.name,
        size: validated.receiptFile.size,
        type: validated.receiptFile.type,
        data: validated.receiptFile.data,
      } : undefined,
      notes: validated.notes,
      erpId: validated.erpId,
      erpType: validated.erpType,
      invoiceNumber: validated.invoiceNumber,
      barcode: validated.barcode,
      ourNumber: validated.ourNumber,
      paymentErpId: validated.paymentErpId,
      paymentMethod: validated.paymentMethod,
      transactionId: validated.transactionId,
      erpMetadata: validated.erpMetadata,
      paymentMetadata: validated.paymentMetadata,
    });

    console.log('✅ Ticket financeiro criado, retornando resposta:', ticket.id);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('❌ Erro no controller de criação de ticket financeiro:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    const errorMessage = (error as Error).message;
    console.error('Mensagem de erro:', errorMessage);
    res.status(400).json({ error: errorMessage });
  }
};

export const updateFinancialTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📥 Recebida requisição para atualizar ticket financeiro:', req.params.id, req.body);
    const validated = updateFinancialTicketSchema.parse(req.body);

    const updateData: any = { ...validated };
    if (validated.dueDate) {
      updateData.dueDate = validated.dueDate instanceof Date ? validated.dueDate : new Date(validated.dueDate);
    }
    if (validated.paymentDate !== undefined) {
      updateData.paymentDate = validated.paymentDate === null ? null : (validated.paymentDate instanceof Date ? validated.paymentDate : new Date(validated.paymentDate));
    }

    const ticket = await updateFinancialTicket(req.params.id, updateData);
    console.log('✅ Ticket financeiro atualizado, retornando resposta:', ticket.id);
    res.json(ticket);
  } catch (error) {
    console.error('❌ Erro no controller de atualização de ticket financeiro:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    const errorMessage = (error as Error).message;
    console.error('Mensagem de erro:', errorMessage);
    res.status(400).json({ error: errorMessage });
  }
};

export const deleteFinancialTicketController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('📥 Recebida requisição para excluir ticket financeiro:', req.params.id);
    await deleteFinancialTicket(req.params.id);
    console.log('✅ Ticket financeiro excluído com sucesso');
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro no controller de exclusão de ticket financeiro:', error);
    const errorMessage = (error as Error).message;
    res.status(404).json({ error: errorMessage });
  }
};

