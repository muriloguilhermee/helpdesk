import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  updateUser: (updatedUser: User) => void;
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
    'view:financial',
    'view:all:financial',
    'create:financial',
    'edit:financial',
    'delete:financial',
  ],
  financial: [
    'view:financial',
    'view:all:financial',
    'create:financial',
    'edit:financial',
    'delete:financial',
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
    'view:own:financial',
    'download:financial',
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

  // Inicializar dados mockados no localStorage na primeira vez
  useEffect(() => {
    // Inicializar allUsers se não existir ou estiver vazio
    const allUsersSaved = localStorage.getItem('allUsers');
    let allUsersArray: User[] = [];
    
    if (allUsersSaved) {
      try {
        allUsersArray = JSON.parse(allUsersSaved);
      } catch {
        // Se houver erro ao parsear, usar mockUsers
        allUsersArray = [];
      }
    }
    
    // Se não houver usuários ou estiver vazio, inicializar com mockUsers
    if (!allUsersSaved || !Array.isArray(allUsersArray) || allUsersArray.length === 0) {
      localStorage.setItem('allUsers', JSON.stringify(mockUsers));
      allUsersArray = mockUsers;
    } else {
      // Garantir que os usuários padrão estejam presentes
      const mockUsersMap = new Map(mockUsers.map(u => [u.id, u]));
      const existingUsersMap = new Map(allUsersArray.map(u => [u.id, u]));
      
      // Adicionar usuários mockados que não existem
      mockUsers.forEach(mockUser => {
        if (!existingUsersMap.has(mockUser.id)) {
          existingUsersMap.set(mockUser.id, mockUser);
        }
      });
      
      const mergedUsers = Array.from(existingUsersMap.values());
      localStorage.setItem('allUsers', JSON.stringify(mergedUsers));
    }

    // Inicializar usersWithPasswords se não existir ou estiver vazio
    const usersWithPasswordsSaved = localStorage.getItem('usersWithPasswords');
    let savedUsersWithPasswords: any[] = [];
    
    if (usersWithPasswordsSaved) {
      try {
        savedUsersWithPasswords = JSON.parse(usersWithPasswordsSaved);
      } catch {
        // Se houver erro ao parsear, usar array vazio
        savedUsersWithPasswords = [];
      }
    }
    
    // Sempre garantir que os usuários padrão com senhas estejam presentes
    const usersWithPasswordsToSave = usersWithPassword.map(({ password, ...user }) => ({
      ...user,
      password,
    }));
    
    // Criar mapa para combinar usuários
    const usersWithPasswordsMap = new Map();
    
    // Adicionar usuários salvos primeiro
    savedUsersWithPasswords.forEach((u: any) => {
      usersWithPasswordsMap.set(u.email.toLowerCase(), u);
    });
    
    // Adicionar/atualizar usuários padrão (garantindo que sempre existam)
    usersWithPasswordsToSave.forEach((u: any) => {
      usersWithPasswordsMap.set(u.email.toLowerCase(), u);
    });
    
    // Salvar no localStorage
    const finalUsersWithPasswords = Array.from(usersWithPasswordsMap.values());
    localStorage.setItem('usersWithPasswords', JSON.stringify(finalUsersWithPasswords));
  }, []);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Buscar versão atualizada do usuário em allUsers se disponível
        const allUsersSaved = localStorage.getItem('allUsers');
        if (allUsersSaved) {
          try {
            const allUsersArray = JSON.parse(allUsersSaved);
            const updatedUser = allUsersArray.find((u: User) => u.id === user.id);
            if (updatedUser) {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              return;
            }
          } catch {
            // Se houver erro, usar o usuário salvo
          }
        }
        setUser(user);
      } catch {
        // Se houver erro ao parsear, limpar
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Normalizar email para comparação (lowercase e trim)
    const normalizedEmail = email.trim().toLowerCase();
    
    // PRIMEIRO: Garantir que os usuários padrão sempre estejam no localStorage
    // Isso é crítico para garantir que o admin padrão sempre funcione
    const usersWithPasswordsToSave = usersWithPassword.map(({ password, ...user }) => ({
      ...user,
      password,
    }));
    
    // Buscar usuários salvos no localStorage (criados pelo admin)
    let savedUsers: any[] = [];
    try {
      const savedUsersStr = localStorage.getItem('usersWithPasswords');
      if (savedUsersStr) {
        savedUsers = JSON.parse(savedUsersStr);
      }
    } catch {
      // Se houver erro, usar array vazio
      savedUsers = [];
    }
    
    // Criar mapa para combinar usuários (email em lowercase como chave)
    const usersMap = new Map();
    
    // PRIMEIRO: Adicionar usuários padrão (garantindo que sempre existam)
    usersWithPasswordsToSave.forEach((u: any) => {
      usersMap.set(u.email.toLowerCase(), u);
    });
    
    // DEPOIS: Adicionar usuários salvos (podem sobrescrever os padrão se necessário)
    savedUsers.forEach((u: any) => {
      // Só adicionar se não for um usuário padrão (para preservar senhas customizadas)
      // Mas se for um usuário padrão, garantir que a senha padrão esteja disponível
      const isDefaultUser = usersWithPasswordsToSave.some(
        (defaultUser: any) => defaultUser.email.toLowerCase() === u.email.toLowerCase()
      );
      
      if (!isDefaultUser) {
        // É um usuário customizado, adicionar
        usersMap.set(u.email.toLowerCase(), u);
      } else {
        // É um usuário padrão, garantir que a senha padrão esteja disponível
        // Mas manter dados atualizados do usuário (como avatar, etc)
        const defaultUser = usersWithPasswordsToSave.find(
          (du: any) => du.email.toLowerCase() === u.email.toLowerCase()
        );
        if (defaultUser) {
          // Manter senha padrão, mas atualizar outros dados do usuário
          usersMap.set(u.email.toLowerCase(), {
            ...u,
            password: defaultUser.password, // Sempre usar senha padrão para usuários padrão
          });
        }
      }
    });
    
    // Salvar no localStorage
    const allUsersWithPasswords = Array.from(usersMap.values());
    localStorage.setItem('usersWithPasswords', JSON.stringify(allUsersWithPasswords));
    
    // Buscar também de allUsers para pegar atualizações
    const allUsersSaved = localStorage.getItem('allUsers');
    let allUsersArray: User[] = [];
    if (allUsersSaved) {
      try {
        allUsersArray = JSON.parse(allUsersSaved);
      } catch {
        // Se houver erro, continuar sem allUsers
      }
    }

    // Combinar todos os usuários para autenticação
    const allUsers = allUsersWithPasswords;
    
    // Simular autenticação (em produção, isso seria uma chamada à API)
    // Comparar email em lowercase e senha exata
    const foundUser = allUsers.find(
      (u: any) => u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (foundUser) {
      // Buscar versão atualizada do usuário em allUsers se disponível
      const updatedUser = allUsersArray.find(u => u.id === foundUser.id) || foundUser;
      const { password: _, ...userWithoutPassword } = updatedUser;
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

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        updateUser,
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

