import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { mockUsers } from '../data/mockData';
import { database } from '../services/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  updateUser: (updatedUser: User) => void;
  updateProfile: (updates: { name?: string; email?: string; avatar?: string; password?: string }) => Promise<boolean>;
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

  // Inicializar dados mockados no banco de dados na primeira vez
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        await database.init();
        
        // Carregar usuários do banco
        let allUsersArray = await database.getUsers();
        
        // Se não houver usuários, inicializar com mockUsers
        if (!allUsersArray || allUsersArray.length === 0) {
          await database.saveUsers(mockUsers);
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
          await database.saveUsers(mergedUsers);
        }

        // Inicializar usersWithPasswords (manter no localStorage por enquanto para compatibilidade)
        const usersWithPasswordsToSave = usersWithPassword.map(({ password, ...user }) => ({
          ...user,
          password,
        }));
        
        // Manter usersWithPasswords no localStorage para login (temporário)
        const usersWithPasswordsSaved = localStorage.getItem('usersWithPasswords');
        let savedUsersWithPasswords: any[] = [];
        
        if (usersWithPasswordsSaved) {
          try {
            savedUsersWithPasswords = JSON.parse(usersWithPasswordsSaved);
          } catch {
            savedUsersWithPasswords = [];
          }
        }
        
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
        
        // Salvar no localStorage (temporário para login)
        const finalUsersWithPasswords = Array.from(usersWithPasswordsMap.values());
        localStorage.setItem('usersWithPasswords', JSON.stringify(finalUsersWithPasswords));
      } catch (error) {
        console.error('Erro ao inicializar usuários:', error);
      }
    };

    initializeUsers();
  }, []);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const loadUser = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Buscar versão atualizada do usuário no banco de dados
          try {
            await database.init();
            const allUsersArray = await database.getUsers();
            const updatedUser = allUsersArray.find((u: User) => u.id === user.id);
            if (updatedUser) {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              return;
            }
          } catch {
            // Se houver erro, usar o usuário salvo
          }
          setUser(user);
        } catch {
          // Se houver erro ao parsear, limpar
          localStorage.removeItem('user');
        }
      }
    };

    loadUser();
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
    
    // Buscar também de allUsers no banco de dados para pegar atualizações
    let allUsersArray: User[] = [];
    try {
      await database.init();
      allUsersArray = await database.getUsers();
    } catch {
      // Se houver erro, continuar sem allUsers
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

  const updateProfile = async (updates: { name?: string; email?: string; avatar?: string; password?: string }): Promise<boolean> => {
    if (!user) return false;

    try {
      // Atualizar usuário logado
      const updatedUser: User = {
        ...user,
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.avatar && { avatar: updates.avatar }),
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Atualizar em allUsers
      const allUsersSaved = localStorage.getItem('allUsers');
      let allUsersArray: User[] = [];
      if (allUsersSaved) {
        try {
          allUsersArray = JSON.parse(allUsersSaved);
        } catch {
          allUsersArray = [];
        }
      }

      const updatedAllUsers = allUsersArray.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            ...(updates.name && { name: updates.name }),
            ...(updates.email && { email: updates.email }),
            ...(updates.avatar && { avatar: updates.avatar }),
          };
        }
        return u;
      });
      localStorage.setItem('allUsers', JSON.stringify(updatedAllUsers));

      // Atualizar senha em usersWithPasswords se fornecida
      if (updates.password) {
        const usersWithPasswordsSaved = localStorage.getItem('usersWithPasswords');
        let usersWithPasswordsArray: any[] = [];
        if (usersWithPasswordsSaved) {
          try {
            usersWithPasswordsArray = JSON.parse(usersWithPasswordsSaved);
          } catch {
            usersWithPasswordsArray = [];
          }
        }

        const updatedUsersWithPasswords = usersWithPasswordsArray.map((u: any) => {
          if (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) {
            return {
              ...u,
              password: updates.password,
              ...(updates.email && { email: updates.email }),
              ...(updates.name && { name: updates.name }),
              ...(updates.avatar && { avatar: updates.avatar }),
            };
          }
          return u;
        });
        localStorage.setItem('usersWithPasswords', JSON.stringify(updatedUsersWithPasswords));
      } else if (updates.email || updates.name || updates.avatar) {
        // Atualizar outros campos em usersWithPasswords mesmo sem mudar senha
        const usersWithPasswordsSaved = localStorage.getItem('usersWithPasswords');
        let usersWithPasswordsArray: any[] = [];
        if (usersWithPasswordsSaved) {
          try {
            usersWithPasswordsArray = JSON.parse(usersWithPasswordsSaved);
          } catch {
            usersWithPasswordsArray = [];
          }
        }

        const updatedUsersWithPasswords = usersWithPasswordsArray.map((u: any) => {
          if (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) {
            return {
              ...u,
              ...(updates.email && { email: updates.email }),
              ...(updates.name && { name: updates.name }),
              ...(updates.avatar && { avatar: updates.avatar }),
            };
          }
          return u;
        });
        localStorage.setItem('usersWithPasswords', JSON.stringify(updatedUsersWithPasswords));
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
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
        updateProfile,
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

