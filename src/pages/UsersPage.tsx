import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, X, Save, AlertTriangle, Camera, User, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers } from '../data/mockData';
import { User as UserType } from '../types';
import { UserAvatar, getInitials } from '../utils/userAvatar';
import { database } from '../services/database';
import { api } from '../services/api';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  technician_n2: 'Técnico N2',
  user: 'Usuário',
  financial: 'Financeiro',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  technician: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  technician_n2: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  user: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  financial: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function UsersPage() {
  const { hasPermission, user: currentUser, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Carregar usuários APENAS do banco de dados (API)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        console.log('📡 Carregando usuários da API...');

        // SEMPRE usar API - sem fallback para dados locais
        const apiUsers = await api.getUsers();

        // Transform API response to User format
        const transformedUsers = apiUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
          company: u.company || undefined,
        }));

        console.log('✅ Usuários carregados da API:', transformedUsers.length);
        setUsers(transformedUsers);
        setIsLoading(false);
      } catch (apiError: any) {
        console.error('❌ Erro ao carregar usuários da API:', apiError);
        // Se a API falhar, mostrar lista vazia ao invés de dados locais
        setUsers([]);
        setIsLoading(false);
        setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
      }
    };

    loadUsers();
  }, []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const createPhotoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [newUserPhoto, setNewUserPhoto] = useState<string | null>(null);
  const [editUserPhoto, setEditUserPhoto] = useState<string | null | undefined>(undefined);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician' | 'technician_n2' | 'financial',
    company: '',
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician' | 'technician_n2' | 'financial',
    company: '',
  });
  const [error, setError] = useState('');

  // Recarregar usuários após exclusão bem-sucedida
  const reloadUsers = async () => {
    try {
      console.log('🔄 Recarregando usuários da API...');
      const apiUsers = await api.getUsers();

      const transformedUsers = apiUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        company: u.company || undefined,
      }));

      setUsers(transformedUsers);
      console.log('✅ Usuários recarregados:', transformedUsers.length);
    } catch (error: any) {
      console.error('❌ Erro ao recarregar usuários:', error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreate = hasPermission('create:user');
  const canEdit = hasPermission('edit:user');
  const canDelete = hasPermission('delete:user');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditUserPhoto(reader.result as string);
      } else {
        setNewUserPhoto(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditUserPhoto(null);
      if (editPhotoInputRef.current) {
        editPhotoInputRef.current.value = '';
      }
    } else {
      setNewUserPhoto(null);
      if (createPhotoInputRef.current) {
        createPhotoInputRef.current.value = '';
      }
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setSuccessMessage('');
    setIsCreatingUser(true);

    // Validações
    if (!newUser.name.trim()) {
      setError('Nome é obrigatório');
      setIsCreatingUser(false);
      return;
    }
    if (!newUser.email.trim()) {
      setError('Email é obrigatório');
      setIsCreatingUser(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      setError('Email inválido');
      setIsCreatingUser(false);
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      setIsCreatingUser(false);
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError('As senhas não coincidem');
      setIsCreatingUser(false);
      return;
    }
    // Verificar duplicatas no banco de dados
    try {
      await database.init();
      const allUsersFromDB = await database.getUsers();

      if (allUsersFromDB.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        setError('Este email já está em uso');
        setIsCreatingUser(false);
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    }

    // Criar novo usuário (normalizar email para lowercase)
    const emailNormalized = newUser.email.toLowerCase().trim();

    let createdUser: UserType;

    // Tentar usar a API do backend primeiro (faz hash da senha corretamente)
    const apiUrl = import.meta.env.VITE_API_URL;
    const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;

    if (apiUrl) {
      try {
        const apiUser = await api.createUser({
          name: newUser.name,
          email: emailNormalized,
          password: newUser.password,
          role: newUser.role,
          avatar: newUserPhoto || undefined,
          company: newUser.company || undefined,
        });

        createdUser = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          avatar: apiUser.avatar,
          company: newUser.company || undefined,
        };
      } catch (apiError: any) {
        console.error('Erro ao criar usuário via API:', apiError);

        // Verificar se é erro de autenticação
        if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized') || apiError.message?.includes('Token')) {
          setError('Você precisa estar logado! Faça logout e login novamente para obter um token válido.');
          setIsCreatingUser(false);
          return;
        }

        // Se estiver usando Supabase e a API falhar, mostrar erro claro
        if (hasSupabase) {
          setError(apiError.message || 'Backend não está rodando! Inicie o servidor com: cd server && npm run dev');
          setIsCreatingUser(false);
          return;
        }

        // Se não estiver usando Supabase, tentar método local
        setError(apiError.message || 'Erro ao criar usuário. Tente novamente.');
        setIsCreatingUser(false);
        return;
      }
    } else if (hasSupabase) {
      // Se estiver usando Supabase mas não tem API configurada
      setError('Backend não configurado! Configure VITE_API_URL no arquivo .env');
      setIsCreatingUser(false);
      return;
    } else {
      // Método local (IndexedDB) - não salva senha no banco
      createdUser = {
        id: Date.now().toString(),
        name: newUser.name,
        email: emailNormalized,
        role: newUser.role,
        avatar: newUserPhoto || undefined,
        company: newUser.company || undefined,
      };

      try {
        await database.init();
        await database.saveUser(createdUser);
      } catch (error) {
        console.error('Erro ao salvar usuário no banco de dados:', error);
        setError('Erro ao salvar usuário. Tente novamente.');
        setIsCreatingUser(false);
        return;
      }

      // Salvar senha no localStorage (apenas para método local)
      const usersWithPasswords = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');

      // Verificar se já existe um usuário com este email (case-insensitive)
      const existingIndex = usersWithPasswords.findIndex(
        (u: any) => u.email && u.email.toLowerCase().trim() === emailNormalized
      );

      const userWithPassword = {
        ...createdUser,
        password: newUser.password,
      };

      if (existingIndex >= 0) {
        usersWithPasswords[existingIndex] = userWithPassword;
      } else {
        usersWithPasswords.push(userWithPassword);
      }

      localStorage.setItem('usersWithPasswords', JSON.stringify(usersWithPasswords));
    }

    // Recarregar lista de usuários do banco
    await reloadUsers();

    // Limpar formulário e fechar modal
    setNewUser({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      company: '',
    });
    setNewUserPhoto(null);
    if (createPhotoInputRef.current) {
      createPhotoInputRef.current.value = '';
    }
    setShowCreateModal(false);
    setIsCreatingUser(false);
    setError('');
    setSuccessMessage('Usuário cadastrado com sucesso!');

    // Limpar mensagem de sucesso após 3 segundos
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleEditClick = (user: UserType) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      company: user.company || '',
    });
    // Se o usuário tem avatar, usar a string. Se não tem, usar undefined (não foi alterado)
    setEditUserPhoto(user.avatar || undefined);
    setError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setError('');

    // Validações
    if (!editUser.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (!editUser.email.trim()) {
      setError('Email é obrigatório');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
      setError('Email inválido');
      return;
    }
    // Verificar duplicatas no banco de dados
    if (editUser.email !== editingUser.email) {
      try {
        await database.init();
        const allUsersFromDB = await database.getUsers();

        if (allUsersFromDB.some(u => u.email.toLowerCase() === editUser.email.toLowerCase() && u.id !== editingUser.id)) {
          setError('Este email já está em uso');
          setIsUpdatingUser(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar duplicatas:', error);
      }
    }
    if (editUser.password && editUser.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      setIsUpdatingUser(false);
      return;
    }
    if (editUser.password && editUser.password !== editUser.confirmPassword) {
      setError('As senhas não coincidem');
      setIsUpdatingUser(false);
      return;
    }

    // Atualizar usuário (normalizar email para lowercase)
    const emailNormalized = editUser.email.toLowerCase().trim();

    // SEMPRE usar API - atualizar no banco de dados
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        const updateData: any = {
          name: editUser.name,
          email: emailNormalized,
          role: editUser.role,
          company: editUser.company || null,
        };

        // Só enviar senha se foi alterada
        if (editUser.password) {
          updateData.password = editUser.password;
        }

        // Só enviar avatar se foi alterado
        // undefined = não foi alterado, não enviar
        // null = foi removido, enviar null
        // string = foi alterado/adicionado, enviar a string
        if (editUserPhoto !== undefined) {
          updateData.avatar = editUserPhoto || null;
          console.log('📤 Avatar será atualizado:', editUserPhoto ? `Avatar presente (${editUserPhoto.substring(0, 50)}...)` : 'Avatar removido (null)');
        } else {
          console.log('📤 Avatar não será alterado (mantém o atual)');
        }

        console.log('📤 Enviando atualização de usuário:', { ...updateData, avatar: updateData.avatar !== undefined ? (updateData.avatar ? `Avatar presente (${updateData.avatar.substring(0, 50)}...)` : 'Avatar removido') : 'Avatar não alterado' });

        const apiUser = await api.updateUser(editingUser.id, updateData);

        // Recarregar lista de usuários do banco
        await reloadUsers();

        // Se o usuário editado for o usuário atual logado, atualizar o AuthContext
        if (editingUser.id === currentUser?.id) {
          updateUser({
            id: apiUser.id,
            name: apiUser.name,
            email: apiUser.email,
            role: apiUser.role,
            avatar: apiUser.avatar,
            company: apiUser.company,
          });
        }

        setIsUpdatingUser(false);
        setSuccessMessage('Usuário atualizado com sucesso!');
      } else {
        throw new Error('API não configurada');
      }
    } catch (apiError: any) {
      console.error('Erro ao atualizar usuário via API:', apiError);
      setError(apiError.message || 'Erro ao atualizar usuário. Verifique se o backend está rodando.');
      setIsUpdatingUser(false);
      return;
    }

    // Limpar e fechar modal
    setShowEditModal(false);
    setEditingUser(null);
    setEditUser({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      company: '',
    });
    setEditUserPhoto(undefined);
    if (editPhotoInputRef.current) {
      editPhotoInputRef.current.value = '';
    }
    setError('');
    setSuccessMessage('Usuário atualizado com sucesso!');

    // Limpar mensagem de sucesso após 3 segundos
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleDeleteUser = async () => {
    if (!showDeleteConfirm) return;

    // Não permitir excluir a si mesmo
    if (showDeleteConfirm === currentUser?.id) {
      setError('Você não pode excluir seu próprio usuário');
      setShowDeleteConfirm(null);
      return;
    }

    try {
      setError('');

      // SEMPRE usar API - excluir do banco de dados
      console.log('🗑️ Excluindo usuário via API:', showDeleteConfirm);
      await api.deleteUser(showDeleteConfirm);
      console.log('✅ Usuário excluído do banco de dados');

      setShowDeleteConfirm(null);
      setSuccessMessage('Usuário excluído com sucesso!');

      // Recarregar lista de usuários do banco (dados atualizados)
      await reloadUsers();

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (apiError: any) {
      console.error('❌ Erro ao excluir usuário:', apiError);
      setError(apiError.message || 'Erro ao excluir usuário. Verifique se o backend está rodando.');
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Usuários</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Usuário</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>

      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Usuário</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Empresa</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Função</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="md" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400 dark:text-gray-500">{user.email}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400 dark:text-gray-500">
                    {user.company || '-'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`badge ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && user.id !== currentUser?.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criar Usuário */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-6 relative">
            {isCreatingUser && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Criando usuário...</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Criar Novo Usuário</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                  setNewUser({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'user',
                    company: '',
                  });
                  setNewUserPhoto(null);
                  if (createPhotoInputRef.current) {
                    createPhotoInputRef.current.value = '';
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Foto do Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto do Usuário
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {newUserPhoto ? (
                      <div className="relative">
                        <img
                          src={newUserPhoto}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(false)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={createPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e, false)}
                      className="hidden"
                      id="create-user-photo"
                    />
                    <label
                      htmlFor="create-user-photo"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      {newUserPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Máximo 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={newUser.company}
                  onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Nome da empresa (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Digite a senha novamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Função
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' | 'technician' | 'technician_n2' | 'financial' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="user">Usuário</option>
                  <option value="technician">Técnico</option>
                  <option value="technician_n2">Técnico N2</option>
                  <option value="financial">Financeiro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
    setNewUser({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      company: '',
    });
                  setNewUserPhoto(null);
                  if (createPhotoInputRef.current) {
                    createPhotoInputRef.current.value = '';
                  }
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isCreatingUser}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingUser ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Criar Usuário
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuário */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4 relative">
            {isUpdatingUser && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Atualizando usuário...</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Editar Usuário</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setError('');
                  setEditUser({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'user',
                    company: '',
                  });
                  setEditUserPhoto(undefined);
                  if (editPhotoInputRef.current) {
                    editPhotoInputRef.current.value = '';
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Foto do Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto do Usuário
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {editUserPhoto !== undefined && editUserPhoto !== null ? (
                      <div className="relative">
                        <img
                          src={editUserPhoto}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(true)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={editPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e, true)}
                      className="hidden"
                      id="edit-user-photo"
                    />
                    <label
                      htmlFor="edit-user-photo"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      {editUserPhoto !== undefined && editUserPhoto !== null ? 'Alterar Foto' : 'Adicionar Foto'}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Máximo 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={editUser.company}
                  onChange={(e) => setEditUser({ ...editUser, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Nome da empresa (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Senha (deixe em branco para manter a atual)
                </label>
                <input
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {editUser.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={editUser.confirmPassword}
                    onChange={(e) => setEditUser({ ...editUser, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Digite a senha novamente"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Função
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as 'admin' | 'user' | 'technician' | 'technician_n2' | 'financial' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="user">Usuário</option>
                  <option value="technician">Técnico</option>
                  <option value="technician_n2">Técnico N2</option>
                  <option value="financial">Financeiro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setError('');
                  setEditUser({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'user',
                    company: '',
                  });
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdatingUser}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingUser ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Excluir Usuário</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tem certeza que deseja excluir o usuário <strong className="text-gray-900 dark:text-gray-100">{users.find(u => u.id === showDeleteConfirm)?.name}</strong>?
                Todos os dados relacionados serão permanentemente removidos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setError('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

