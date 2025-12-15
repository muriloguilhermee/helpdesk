import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection.js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'technician' | 'technician_n2' | 'user' | 'financial';
  avatar?: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: { id: string; email: string; role: string }): string => {
  const secret: string = (process.env.JWT_SECRET as string) || 'secret';
  const expiresIn: string = (process.env.JWT_EXPIRES_IN as string) || '7d';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn } as jwt.SignOptions
  );
};

export const login = async (credentials: LoginCredentials) => {
  const db = getDatabase();

  const user = await db('users')
    .where({ email: credentials.email })
    .first();

  if (!user) {
    throw new Error('Email ou senha incorretos');
  }

  const isValidPassword = await comparePassword(credentials.password, user.password);
  if (!isValidPassword) {
    throw new Error('Email ou senha incorretos');
  }

  const { password, ...userWithoutPassword } = user;
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: userWithoutPassword,
    token,
  };
};

export const register = async (data: RegisterData) => {
  const db = getDatabase();

  // Check if user exists
  const existingUser = await db('users')
    .where({ email: data.email })
    .first();

  if (existingUser) {
    throw new Error('Email já está em uso');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const [user] = await db('users')
    .insert({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
      avatar: data.avatar || null,
    })
    .returning(['id', 'email', 'name', 'role', 'avatar', 'created_at', 'updated_at']);

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user,
    token,
  };
};

