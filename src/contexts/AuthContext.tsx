import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { mockUsers } from '../data/mockData';
import { database } from '../services/database';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
    'create:ticket',
    'edit:ticket',
    'close:ticket',
  ],
  technician_n2: [
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
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');

      // Se tem Supabase configurado, OBRIGATORIAMENTE precisa ter token
      const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = import.meta.env.VITE_API_URL;

      if (hasSupabase && apiUrl && (!savedToken || !savedUser)) {
        // Se está usando Supabase mas não tem token, limpar tudo e forçar login
        console.log('⚠️ Supabase configurado mas sem token. Limpando sessão...');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoading(false);
        return;
      }

      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);

          // Se tem Supabase mas não tem token, não permitir login automático
          if (hasSupabase && apiUrl && !savedToken) {
            console.log('⚠️ Usuário encontrado mas sem token. Limpando sessão...');
            localStorage.removeItem('user');
            setIsLoading(false);
            return;
          }

          // Buscar versão atualizada do usuário no banco de dados
          try {
            await database.init();
            const allUsersArray = await database.getUsers();
            const updatedUser = allUsersArray.find((u: User) => u.id === user.id);
            if (updatedUser) {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setIsLoading(false);
              return;
            }
          } catch {
            // Se houver erro, usar o usuário salvo
          }
          setUser(user);
          setIsLoading(false);
        } catch {
          // Se houver erro ao parsear, limpar
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setIsLoading(false);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 [AUTH] Função login chamada', { email, hasPassword: !!password });
    const apiUrl = import.meta.env.VITE_API_URL;
    const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;

    console.log('🔐 [AUTH] Variáveis de ambiente:', {
      apiUrl,
      hasSupabase,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL
    });

    // Se Supabase está configurado, OBRIGATORIAMENTE usar API
    if (hasSupabase && !apiUrl) {
      console.error('❌ [AUTH] Supabase configurado mas API_URL não configurada');
      throw new Error('Backend não configurado! Configure VITE_API_URL no arquivo .env');
    }

    // Try API first
    if (apiUrl) {
      console.log('🔐 [AUTH] API URL encontrada, tentando login via API...');
      try {
        console.log('🔐 Tentando login via API...', { apiUrl, email });
        const response = await api.login(email, password);
        console.log('✅ Resposta da API:', response);

        if (!response || !response.token) {
          throw new Error('Token não recebido da API');
        }

        const { user, token } = response;
        console.log('💾 Salvando token no localStorage...', { token: token.substring(0, 20) + '...' });

        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);

        // Verificar se foi salvo
        const savedToken = localStorage.getItem('token');
        console.log('✅ Token salvo?', !!savedToken);

        return true;
      } catch (apiError: any) {
        console.error('❌ Erro no login via API:', apiError);
        console.error('Detalhes do erro:', {
          message: apiError.message,
          status: (apiError as any).status,
          stack: apiError.stack
        });

        // Se for erro 429 (Too Many Requests), mostrar mensagem específica
        if (apiError.status === 429) {
          throw new Error('Muitas requisições. O servidor está temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.');
        }

        // Se Supabase está configurado, não permitir fallback local
        if (hasSupabase) {
          const errorMsg = apiError.message || 'Erro ao fazer login. Verifique se o backend está rodando.';
          throw new Error(errorMsg);
        }
        // Fallback to local authentication apenas se não estiver usando Supabase
        console.log('⚠️ API not available, using local auth');
      }
    }

    // Fallback: Local authentication
    const normalizedEmail = email.trim().toLowerCase();

    const usersWithPasswordsToSave = usersWithPassword.map(({ password, ...user }) => ({
      ...user,
      password,
    }));

    let savedUsers: any[] = [];
    try {
      const savedUsersStr = localStorage.getItem('usersWithPasswords');
      if (savedUsersStr) {
        savedUsers = JSON.parse(savedUsersStr);
      }
    } catch {
      savedUsers = [];
    }

    const usersMap = new Map();
    usersWithPasswordsToSave.forEach((u: any) => {
      usersMap.set(u.email.toLowerCase(), u);
    });

    savedUsers.forEach((u: any) => {
      const isDefaultUser = usersWithPasswordsToSave.some(
        (defaultUser: any) => defaultUser.email.toLowerCase() === u.email.toLowerCase()
      );

      if (!isDefaultUser) {
        usersMap.set(u.email.toLowerCase(), u);
      } else {
        const defaultUser = usersWithPasswordsToSave.find(
          (du: any) => du.email.toLowerCase() === u.email.toLowerCase()
        );
        if (defaultUser) {
          usersMap.set(u.email.toLowerCase(), {
            ...u,
            password: defaultUser.password,
          });
        }
      }
    });

    const allUsersWithPasswords = Array.from(usersMap.values());
    localStorage.setItem('usersWithPasswords', JSON.stringify(allUsersWithPasswords));

    let allUsersArray: User[] = [];
    try {
      await database.init();
      allUsersArray = await database.getUsers();
    } catch {
      // Continue without database
    }

    const foundUser = allUsersWithPasswords.find(
      (u: any) => u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (foundUser) {
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
    localStorage.removeItem('token');
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

      // Atualizar no banco de dados IndexedDB
      try {
        await database.init();

        // Salvar usuário atualizado diretamente no banco
        await database.saveUser(updatedUser);

        // Atualizar também na lista completa de usuários
        let allUsersArray = await database.getUsers();
        const updatedAllUsers = allUsersArray.map(u => {
          if (u.id === user.id) {
            // Usar o updatedUser completo para garantir que todos os campos estejam atualizados
            return updatedUser;
          }
          return u;
        });

        // Salvar todos os usuários atualizados
        await database.saveUsers(updatedAllUsers);

        console.log('Perfil atualizado no banco de dados com sucesso', {
          userId: updatedUser.id,
          hasAvatar: !!updatedUser.avatar
        });
      } catch (error) {
        console.error('Erro ao atualizar usuário no banco de dados:', error);
        // Continuar mesmo se houver erro no banco
      }

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
        isLoading,
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

