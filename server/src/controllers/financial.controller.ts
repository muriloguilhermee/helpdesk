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

    
    const validated = createFinancialTicketSchema.parse(req.body);

    const ticket = await createFinancialTicket({
      ...validated,
      dueDate: validated.dueDate instanceof Date ? validated.dueDate : new Date(validated.dueDate),
      paymentDate: validated.paymentDate ? (validated.paymentDate instanceof Date ? validated.paymentDate : new Date(validated.paymentDate)) : undefined,
      createdBy: req.user.id,
    });

    
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
    
    const validated = updateFinancialTicketSchema.parse(req.body);

    const updateData: any = { ...validated };
    if (validated.dueDate) {
      updateData.dueDate = validated.dueDate instanceof Date ? validated.dueDate : new Date(validated.dueDate);
    }
    if (validated.paymentDate !== undefined) {
      updateData.paymentDate = validated.paymentDate === null ? null : (validated.paymentDate instanceof Date ? validated.paymentDate : new Date(validated.paymentDate));
    }

    const ticket = await updateFinancialTicket(req.params.id, updateData);
    
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
    
    await deleteFinancialTicket(req.params.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro no controller de exclusão de ticket financeiro:', error);
    const errorMessage = (error as Error).message;
    res.status(404).json({ error: errorMessage });
  }
};

