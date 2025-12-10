import { getDatabase } from '../database/connection.js';
import { hashPassword } from './auth.service.js';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'technician' | 'user';
  avatar?: string;
  company?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'technician' | 'user';
  avatar?: string;
  company?: string;
}

export const getAllUsers = async () => {
  const db = getDatabase();
  return db('users')
    .select('id', 'email', 'name', 'role', 'avatar', 'company', 'created_at', 'updated_at')
    .orderBy('created_at', 'desc');
};

export const getUserById = async (id: string) => {
  const db = getDatabase();
  const user = await db('users')
    .where({ id })
    .select('id', 'email', 'name', 'role', 'avatar', 'company', 'created_at', 'updated_at')
    .first();

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return user;
};

export const getUserByEmail = async (email: string) => {
  const db = getDatabase();
  return db('users')
    .where({ email })
    .first();
};

export const createUser = async (data: CreateUserData) => {
  try {
    const db = getDatabase();

    // Check if email exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    console.log('📝 Criando usuário:', { email: data.email, name: data.name, role: data.role });

    console.log('🖼️ Avatar recebido:', data.avatar ? `Avatar presente (${data.avatar.substring(0, 50)}...)` : 'Sem avatar');

    const insertResult = await db('users')
      .insert({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        avatar: data.avatar || null,
        company: data.company || null,
      })
      .returning(['id', 'email', 'name', 'role', 'avatar', 'company', 'created_at', 'updated_at']);

    console.log('📦 Resultado do insert:', insertResult);
    console.log('🖼️ Avatar salvo no banco:', insertResult[0]?.avatar ? `Avatar presente (${insertResult[0].avatar.substring(0, 50)}...)` : 'Sem avatar');

    // O returning pode retornar array ou objeto dependendo do driver
    const user = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!user || !user.id) {
      // Se não retornou, buscar o usuário criado
      console.log('⚠️  Returning não retornou dados, buscando usuário criado...');
      const createdUser = await getUserByEmail(data.email);
      if (!createdUser) {
        throw new Error('Falha ao criar usuário: registro não foi criado');
      }
      console.log('✅ Usuário encontrado após criação:', createdUser.id);
      return {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        avatar: createdUser.avatar,
        created_at: createdUser.created_at,
        updated_at: createdUser.updated_at,
      };
    }

    console.log('✅ Usuário criado com sucesso:', user.id);
    return user;
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
};

export const updateUser = async (id: string, data: UpdateUserData) => {
  const db = getDatabase();

  // Check if user exists
  await getUserById(id);

  // Check if email is being changed and if it's already in use
  if (data.email) {
    const existingUser = await getUserByEmail(data.email);
    if (existingUser && existingUser.id !== id) {
      throw new Error('Email já está em uso');
    }
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.role) updateData.role = data.role;
  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar || null;
    console.log('🖼️ Atualizando avatar:', data.avatar ? `Avatar presente (${data.avatar.substring(0, 50)}...)` : 'Avatar removido (null)');
  }
  if (data.company !== undefined) updateData.company = data.company;

  // Only update password if provided
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const [user] = await db('users')
    .where({ id })
    .update(updateData)
    .returning(['id', 'email', 'name', 'role', 'avatar', 'company', 'created_at', 'updated_at']);

  console.log('🖼️ Avatar após update:', user?.avatar ? `Avatar presente (${user.avatar.substring(0, 50)}...)` : 'Sem avatar');

  return user;
};

export const deleteUser = async (id: string) => {
  try {
    const db = getDatabase();

    console.log('🗑️ Excluindo usuário:', id);

    // Check if user exists
    const user = await getUserById(id);
    console.log('✅ Usuário encontrado:', user.email);

    // Verificar quantos tickets serão afetados
    const ticketsCreated = await db('tickets')
      .where({ created_by: id })
      .count('* as count')
      .first();

    const ticketsAssigned = await db('tickets')
      .where({ assigned_to: id })
      .count('* as count')
      .first();

    const ticketsClient = await db('tickets')
      .where({ client_id: id })
      .count('* as count')
      .first();

    const totalTicketsCreated = parseInt(ticketsCreated?.count as string) || 0;
    const totalTicketsAssigned = parseInt(ticketsAssigned?.count as string) || 0;
    const totalTicketsClient = parseInt(ticketsClient?.count as string) || 0;

    console.log(`📊 Tickets relacionados: ${totalTicketsCreated} criados, ${totalTicketsAssigned} atribuídos, ${totalTicketsClient} como cliente`);

    // Excluir usuário
    // Tickets criados terão created_by setado para NULL (ON DELETE SET NULL) - tickets permanecem
    // Tickets atribuídos terão assigned_to setado para NULL (ON DELETE SET NULL) - tickets permanecem
    // Tickets como cliente terão client_id setado para NULL (ON DELETE SET NULL) - tickets permanecem
    // Comentários terão author_id setado para NULL (ON DELETE SET NULL) - comentários permanecem
    await db('users').where({ id }).delete();

    console.log(`✅ Usuário excluído com sucesso. ${totalTicketsCreated} ticket(s) criado(s) pelo usuário permanecerão no sistema (sem referência ao usuário).`);
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error);
    throw error;
  }
};

