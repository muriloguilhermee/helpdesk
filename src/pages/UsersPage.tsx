import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, X, Save, AlertTriangle, Camera, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers } from '../data/mockData';
import { User as UserType } from '../types';
import { UserAvatar, getInitials } from '../utils/userAvatar';
import { database } from '../services/database';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  user: 'Usuário',
  financial: 'Financeiro',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  technician: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  financial: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function UsersPage() {
  const { hasPermission, user: currentUser, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuários do banco de dados
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await database.init();
        const allUsers = await database.getUsers();
        
        // Filtrar apenas usuários que NÃO são mockados
        const mockUserEmails = new Set(mockUsers.map(u => u.email.toLowerCase()));
        const customUsers = allUsers.filter(u => !mockUserEmails.has(u.email.toLowerCase()));
        
        setUsers(customUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
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
  const [editUserPhoto, setEditUserPhoto] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician' | 'financial',
    company: '',
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician' | 'financial',
    company: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Salvar usuários customizados no banco de dados sempre que houver mudanças
  useEffect(() => {
    if (!isLoading) {
      const saveUsers = async () => {
        try {
          await database.init();
          // Buscar todos os usuários do banco
          const allUsersFromDB = await database.getUsers();
          
          // Filtrar mockUsers
          const mockUserEmails = new Set(mockUsers.map(u => u.email.toLowerCase()));
          const existingMockUsers = allUsersFromDB.filter((u: UserType) => 
            mockUserEmails.has(u.email.toLowerCase())
          );
          
          // Combinar mockUsers com usuários customizados
          const allUsers = [...existingMockUsers, ...users];
          await database.saveUsers(allUsers);
        } catch (error) {
          console.error('Erro ao salvar usuários no banco de dados:', error);
        }
      };

      saveUsers();
    }
  }, [users, isLoading]);

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

    // Validações
    if (!newUser.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (!newUser.email.trim()) {
      setError('Email é obrigatório');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      setError('Email inválido');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    // Verificar duplicatas no banco de dados
    try {
      await database.init();
      const allUsersFromDB = await database.getUsers();
      
      if (allUsersFromDB.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        setError('Este email já está em uso');
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    }

    // Criar novo usuário (normalizar email para lowercase)
    const emailNormalized = newUser.email.toLowerCase().trim();
    const createdUser: UserType = {
      id: Date.now().toString(),
      name: newUser.name,
      email: emailNormalized,
      role: newUser.role,
      avatar: newUserPhoto || undefined,
      company: newUser.company || undefined,
    };

    // IMPORTANTE: Salvar no banco de dados primeiro
    try {
      await database.init();
      await database.saveUser(createdUser);
    } catch (error) {
      console.error('Erro ao salvar usuário no banco de dados:', error);
      setError('Erro ao salvar usuário. Tente novamente.');
      return;
    }

    const updatedUsers = [...users, createdUser];
    setUsers(updatedUsers);

    // Salvar senha no localStorage (em produção, isso seria no backend de forma segura)
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
    setEditUserPhoto(user.avatar || null);
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
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar duplicatas:', error);
      }
    }
    if (editUser.password && editUser.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (editUser.password && editUser.password !== editUser.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    // Atualizar usuário (normalizar email para lowercase)
    const emailNormalized = editUser.email.toLowerCase().trim();
    const updatedUser = {
      ...editingUser,
      name: editUser.name,
      email: emailNormalized,
      role: editUser.role,
      avatar: editUserPhoto || undefined,
      company: editUser.company || undefined
    };
    
    // IMPORTANTE: Salvar no banco de dados
    try {
      await database.init();
      await database.saveUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário no banco de dados:', error);
      setError('Erro ao atualizar usuário. Tente novamente.');
      return;
    }
    
    const updatedUsers = users.map(u =>
      u.id === editingUser.id ? updatedUser : u
    );
    setUsers(updatedUsers);

    // Atualizar usersWithPasswords sempre (não só quando senha muda)
    const usersWithPasswords = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');
    
    // Buscar por ID primeiro
    let userIndex = usersWithPasswords.findIndex((u: any) => u.id === editingUser.id);
    
    // Se não encontrar por ID, buscar por email (case-insensitive)
    if (userIndex < 0) {
      userIndex = usersWithPasswords.findIndex(
        (u: any) => u.email && u.email.toLowerCase().trim() === emailNormalized
      );
    }
    
    const userWithPassword = {
      ...updatedUser,
      password: editUser.password || (userIndex >= 0 ? usersWithPasswords[userIndex].password : ''),
    };
    
    if (userIndex >= 0) {
      usersWithPasswords[userIndex] = userWithPassword;
    } else {
      usersWithPasswords.push(userWithPassword);
    }
    localStorage.setItem('usersWithPasswords', JSON.stringify(usersWithPasswords));

    // Se o usuário editado for o usuário atual logado, atualizar o AuthContext
    if (editingUser.id === currentUser?.id) {
      const { password: _, ...userWithoutPassword } = userWithPassword;
      updateUser(userWithoutPassword);
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
    setEditUserPhoto(null);
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

    // Remover usuário
    const updatedUsers = users.filter(u => u.id !== showDeleteConfirm);
    setUsers(updatedUsers);

    // Remover do localStorage de senhas
    const usersWithPasswords = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');
    const filteredPasswords = usersWithPasswords.filter((u: any) => u.id !== showDeleteConfirm);
    localStorage.setItem('usersWithPasswords', JSON.stringify(filteredPasswords));

    setShowDeleteConfirm(null);
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
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
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' | 'technician' | 'financial' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="user">Usuário</option>
                  <option value="technician">Técnico</option>
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
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuário */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6 my-4">
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
                  });
                  setEditUserPhoto(null);
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
                    {editUserPhoto ? (
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
                      {editUserPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
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
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as 'admin' | 'user' | 'technician' | 'financial' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="user">Usuário</option>
                  <option value="technician">Técnico</option>
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
                  });
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Alterações
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

