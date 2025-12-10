import { getDatabase } from '../database/connection.js';
import { hashPassword } from './auth.service.js';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'technician' | 'user';
  avatar?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'technician' | 'user';
  avatar?: string;
}

export const getAllUsers = async () => {
  const db = getDatabase();
  return db('users')
    .select('id', 'email', 'name', 'role', 'avatar', 'created_at', 'updated_at')
    .orderBy('created_at', 'desc');
};

export const getUserById = async (id: string) => {
  const db = getDatabase();
  const user = await db('users')
    .where({ id })
    .select('id', 'email', 'name', 'role', 'avatar', 'created_at', 'updated_at')
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

    const insertResult = await db('users')
      .insert({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        avatar: data.avatar || null,
      })
      .returning(['id', 'email', 'name', 'role', 'avatar', 'created_at', 'updated_at']);

    console.log('📦 Resultado do insert:', insertResult);

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
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  // Only update password if provided
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const [user] = await db('users')
    .where({ id })
    .update(updateData)
    .returning(['id', 'email', 'name', 'role', 'avatar', 'created_at', 'updated_at']);

  return user;
};

export const deleteUser = async (id: string) => {
  const db = getDatabase();

  // Check if user exists
  await getUserById(id);

  await db('users').where({ id }).delete();
};

