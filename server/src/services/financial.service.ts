import { getDatabase } from '../database/connection.js';

export interface CreateFinancialTicketData {
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  clientId: string;
  createdBy: string;
  invoiceFile?: {
    name: string;
    size: number;
    type: string;
    data: string;
  };
  receiptFile?: {
    name: string;
    size: number;
    type: string;
    data: string;
  };
  notes?: string;
  erpId?: string;
  erpType?: string;
  invoiceNumber?: string;
  barcode?: string;
  ourNumber?: string;
  paymentErpId?: string;
  paymentMethod?: string;
  transactionId?: string;
  erpMetadata?: Record<string, any>;
  paymentMetadata?: Record<string, any>;
}

export interface UpdateFinancialTicketData {
  title?: string;
  description?: string;
  amount?: number;
  dueDate?: Date;
  paymentDate?: Date;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  clientId?: string;
  invoiceFile?: {
    name: string;
    size: number;
    type: string;
    data: string;
  } | null;
  receiptFile?: {
    name: string;
    size: number;
    type: string;
    data: string;
  } | null;
  notes?: string;
  erpId?: string;
  erpType?: string;
  invoiceNumber?: string;
  barcode?: string;
  ourNumber?: string;
  paymentErpId?: string;
  paymentMethod?: string;
  transactionId?: string;
  erpMetadata?: Record<string, any>;
  paymentMetadata?: Record<string, any>;
}

export const getAllFinancialTickets = async () => {
  const db = getDatabase();

  const tickets = await db('financial_tickets')
    .leftJoin('users as client', 'financial_tickets.client_id', 'client.id')
    .leftJoin('users as creator', 'financial_tickets.created_by', 'creator.id')
    .select(
      'financial_tickets.*',
      db.raw(`
        CASE
          WHEN client.id IS NOT NULL THEN
            json_build_object(
              'id', client.id,
              'name', client.name,
              'email', client.email,
              'role', client.role,
              'avatar', client.avatar
            )
          ELSE NULL
        END as client_user
      `),
      db.raw(`
        CASE
          WHEN creator.id IS NOT NULL THEN
            json_build_object(
              'id', creator.id,
              'name', creator.name,
              'email', creator.email,
              'role', creator.role,
              'avatar', creator.avatar
            )
          ELSE NULL
        END as created_by_user
      `)
    )
    .orderBy('financial_tickets.created_at', 'desc');

  return tickets.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    amount: parseFloat(t.amount),
    dueDate: t.due_date,
    paymentDate: t.payment_date,
    status: t.status,
    client: t.client_user,
    createdBy: t.created_by_user,
    invoiceFile: t.invoice_file_name ? {
      id: `invoice-${t.id}`,
      name: t.invoice_file_name,
      size: parseInt(t.invoice_file_size),
      type: t.invoice_file_type,
      data: t.invoice_file_data,
    } : undefined,
    receiptFile: t.receipt_file_name ? {
      id: `receipt-${t.id}`,
      name: t.receipt_file_name,
      size: parseInt(t.receipt_file_size),
      type: t.receipt_file_type,
      data: t.receipt_file_data,
    } : undefined,
    notes: t.notes,
    erpId: t.erp_id,
    erpType: t.erp_type,
    invoiceNumber: t.invoice_number,
    barcode: t.barcode,
    ourNumber: t.our_number,
    paymentErpId: t.payment_erp_id,
    paymentMethod: t.payment_method,
    transactionId: t.transaction_id,
    erpMetadata: t.erp_metadata ? (typeof t.erp_metadata === 'string' ? JSON.parse(t.erp_metadata) : t.erp_metadata) : undefined,
    paymentMetadata: t.payment_metadata ? (typeof t.payment_metadata === 'string' ? JSON.parse(t.payment_metadata) : t.payment_metadata) : undefined,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
};

export const getFinancialTicketById = async (id: string) => {
  const db = getDatabase();

  const ticket = await db('financial_tickets')
    .leftJoin('users as client', 'financial_tickets.client_id', 'client.id')
    .leftJoin('users as creator', 'financial_tickets.created_by', 'creator.id')
    .where('financial_tickets.id', id)
    .select(
      'financial_tickets.*',
      db.raw(`
        CASE
          WHEN client.id IS NOT NULL THEN
            json_build_object(
              'id', client.id,
              'name', client.name,
              'email', client.email,
              'role', client.role,
              'avatar', client.avatar
            )
          ELSE NULL
        END as client_user
      `),
      db.raw(`
        CASE
          WHEN creator.id IS NOT NULL THEN
            json_build_object(
              'id', creator.id,
              'name', creator.name,
              'email', creator.email,
              'role', creator.role,
              'avatar', creator.avatar
            )
          ELSE NULL
        END as created_by_user
      `)
    )
    .first();

  if (!ticket) {
    throw new Error('Ticket financeiro não encontrado');
  }

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    amount: parseFloat(ticket.amount),
    dueDate: ticket.due_date,
    paymentDate: ticket.payment_date,
    status: ticket.status,
    client: ticket.client_user,
    createdBy: ticket.created_by_user,
    invoiceFile: ticket.invoice_file_name ? {
      id: `invoice-${ticket.id}`,
      name: ticket.invoice_file_name,
      size: parseInt(ticket.invoice_file_size),
      type: ticket.invoice_file_type,
      data: ticket.invoice_file_data,
    } : undefined,
    receiptFile: ticket.receipt_file_name ? {
      id: `receipt-${ticket.id}`,
      name: ticket.receipt_file_name,
      size: parseInt(ticket.receipt_file_size),
      type: ticket.receipt_file_type,
      data: ticket.receipt_file_data,
    } : undefined,
    notes: ticket.notes,
    erpId: ticket.erp_id,
    erpType: ticket.erp_type,
    invoiceNumber: ticket.invoice_number,
    barcode: ticket.barcode,
    ourNumber: ticket.our_number,
    paymentErpId: ticket.payment_erp_id,
    paymentMethod: ticket.payment_method,
    transactionId: ticket.transaction_id,
    erpMetadata: ticket.erp_metadata ? (typeof ticket.erp_metadata === 'string' ? JSON.parse(ticket.erp_metadata) : ticket.erp_metadata) : undefined,
    paymentMetadata: ticket.payment_metadata ? (typeof ticket.payment_metadata === 'string' ? JSON.parse(ticket.payment_metadata) : ticket.payment_metadata) : undefined,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
};

export const createFinancialTicket = async (data: CreateFinancialTicketData) => {
  try {
    const db = getDatabase();

    console.log('📝 Criando ticket financeiro:', { title: data.title, amount: data.amount });

    // Generate ticket ID
    const ticketCount = await db('financial_tickets').count('* as count').first();
    const count = ticketCount?.count;
    const nextId = `FT-${String((parseInt(count as string) || 0) + 1).padStart(5, '0')}`;

    console.log('🆔 Próximo ID do ticket financeiro:', nextId);

    const insertResult = await db('financial_tickets')
      .insert({
        id: nextId,
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        due_date: data.dueDate,
        payment_date: data.paymentDate || null,
        status: data.status,
        client_id: data.clientId,
        created_by: data.createdBy,
        invoice_file_name: data.invoiceFile?.name || null,
        invoice_file_size: data.invoiceFile?.size || null,
        invoice_file_type: data.invoiceFile?.type || null,
        invoice_file_data: data.invoiceFile?.data || null,
        receipt_file_name: data.receiptFile?.name || null,
        receipt_file_size: data.receiptFile?.size || null,
        receipt_file_type: data.receiptFile?.type || null,
        receipt_file_data: data.receiptFile?.data || null,
        notes: data.notes || null,
        erp_id: data.erpId || null,
        erp_type: data.erpType || null,
        invoice_number: data.invoiceNumber || null,
        barcode: data.barcode || null,
        our_number: data.ourNumber || null,
        payment_erp_id: data.paymentErpId || null,
        payment_method: data.paymentMethod || null,
        transaction_id: data.transactionId || null,
        erp_metadata: data.erpMetadata ? JSON.stringify(data.erpMetadata) : null,
        payment_metadata: data.paymentMetadata ? JSON.stringify(data.paymentMetadata) : null,
      })
      .returning('*');

    console.log('📦 Resultado do insert:', insertResult);

    const ticket = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!ticket || !ticket.id) {
      throw new Error('Falha ao criar ticket financeiro: nenhum registro retornado');
    }

    console.log('✅ Ticket financeiro criado com sucesso:', ticket.id);

    const fullTicket = await getFinancialTicketById(ticket.id);
    console.log('✅ Ticket financeiro completo retornado');
    return fullTicket;
  } catch (error: any) {
    console.error('❌ Erro ao criar ticket financeiro:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export const updateFinancialTicket = async (id: string, data: UpdateFinancialTicketData) => {
  try {
    const db = getDatabase();

    console.log('📝 Atualizando ticket financeiro:', id, data);

    // Check if ticket exists
    await getFinancialTicketById(id);

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount) updateData.amount = data.amount;
    if (data.dueDate) updateData.due_date = data.dueDate;
    if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
    if (data.status) updateData.status = data.status;
    if (data.clientId) updateData.client_id = data.clientId;
    if (data.invoiceFile !== undefined) {
      if (data.invoiceFile === null) {
        updateData.invoice_file_name = null;
        updateData.invoice_file_size = null;
        updateData.invoice_file_type = null;
        updateData.invoice_file_data = null;
      } else {
        updateData.invoice_file_name = data.invoiceFile.name;
        updateData.invoice_file_size = data.invoiceFile.size;
        updateData.invoice_file_type = data.invoiceFile.type;
        updateData.invoice_file_data = data.invoiceFile.data;
      }
    }
    if (data.receiptFile !== undefined) {
      if (data.receiptFile === null) {
        updateData.receipt_file_name = null;
        updateData.receipt_file_size = null;
        updateData.receipt_file_type = null;
        updateData.receipt_file_data = null;
      } else {
        updateData.receipt_file_name = data.receiptFile.name;
        updateData.receipt_file_size = data.receiptFile.size;
        updateData.receipt_file_type = data.receiptFile.type;
        updateData.receipt_file_data = data.receiptFile.data;
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.erpId !== undefined) updateData.erp_id = data.erpId;
    if (data.erpType !== undefined) updateData.erp_type = data.erpType;
    if (data.invoiceNumber !== undefined) updateData.invoice_number = data.invoiceNumber;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.ourNumber !== undefined) updateData.our_number = data.ourNumber;
    if (data.paymentErpId !== undefined) updateData.payment_erp_id = data.paymentErpId;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.transactionId !== undefined) updateData.transaction_id = data.transactionId;
    if (data.erpMetadata !== undefined) updateData.erp_metadata = data.erpMetadata ? JSON.stringify(data.erpMetadata) : null;
    if (data.paymentMetadata !== undefined) updateData.payment_metadata = data.paymentMetadata ? JSON.stringify(data.paymentMetadata) : null;

    // Atualizar updated_at manualmente
    updateData.updated_at = db.fn.now();

    const updateResult = await db('financial_tickets')
      .where({ id })
      .update(updateData);

    console.log('📦 Resultado do update:', updateResult);

    const updatedTicket = await getFinancialTicketById(id);
    console.log('✅ Ticket financeiro atualizado com sucesso');
    return updatedTicket;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar ticket financeiro:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export const deleteFinancialTicket = async (id: string) => {
  try {
    const db = getDatabase();

    console.log('🗑️ Excluindo ticket financeiro:', id);

    // Check if ticket exists
    const ticket = await getFinancialTicketById(id);
    console.log('✅ Ticket financeiro encontrado:', ticket.title);

    // Excluir ticket
    await db('financial_tickets').where({ id }).delete();

    console.log('✅ Ticket financeiro excluído com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao excluir ticket financeiro:', error);
    throw error;
  }
};

