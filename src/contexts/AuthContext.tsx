import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Definição de permissões por role
const permissions: Record<string, string[]> = {
  admin: [
    'view:dashboard',
    'view:tickets',
    'create:ticket',
    'edit:ticket',
    'delete:ticket',
    'assign:ticket',
    'view:users',
    'create:user',
    'edit:user',
    'delete:user',
    'view:reports',
    'view:settings',
    'edit:settings',
  ],
  technician: [
    'view:tickets',
    'view:pending:tickets',
    'edit:ticket',
    'close:ticket',
  ],
  user: [
    'view:tickets',
    'create:ticket',
    'view:own:tickets',
  ],
};

// Mock de usuários com senhas (em produção, isso viria de uma API)
const usersWithPassword = [
  { ...mockUsers[0], password: 'Eloah@210818' }, // Murilo - admin
  { ...mockUsers[1], password: 'admin123' }, // João - admin
  { ...mockUsers[2], password: 'tech123' },  // Maria - technician
  { ...mockUsers[3], password: 'user123' },  // Pedro - user
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Buscar usuários salvos no localStorage (criados pelo admin)
    const savedUsers = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');

    // Combinar usuários padrão com os criados
    const allUsers = [...usersWithPassword, ...savedUsers];

    // Simular autenticação (em produção, isso seria uma chamada à API)
    const foundUser = allUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

