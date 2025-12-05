import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, UserPlus, X, Save, AlertTriangle, Camera, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers } from '../data/mockData';
import { User as UserType } from '../types';
import { UserAvatar, getInitials } from '../utils/userAvatar';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  user: 'Usuário',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  technician: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-800',
};

export default function UsersPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>(() => {
    // Carregar usuários do localStorage ou usar os mockados
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch {
        return mockUsers;
      }
    }
    return mockUsers;
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const createPhotoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [newUserPhoto, setNewUserPhoto] = useState<string | null>(null);
  const [editUserPhoto, setEditUserPhoto] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician',
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'user' | 'technician',
  });
  const [error, setError] = useState('');

  // Salvar usuários no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

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

  const handleCreateUser = () => {
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
    if (users.some(u => u.email === newUser.email)) {
      setError('Este email já está em uso');
      return;
    }

    // Criar novo usuário
    const createdUser: UserType = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUserPhoto || undefined,
    };

    setUsers([...users, createdUser]);

    // Salvar no localStorage de usuários
    localStorage.setItem('users', JSON.stringify([...users, createdUser]));

    // Salvar senha no localStorage (em produção, isso seria no backend de forma segura)
    const usersWithPasswords = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');
    usersWithPasswords.push({
      ...createdUser,
      password: newUser.password,
    });
    localStorage.setItem('usersWithPasswords', JSON.stringify(usersWithPasswords));

    // Limpar formulário e fechar modal
    setNewUser({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    });
    setNewUserPhoto(null);
    if (createPhotoInputRef.current) {
      createPhotoInputRef.current.value = '';
    }
    setShowCreateModal(false);
    setError('');
  };

  const handleEditClick = (user: UserType) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
    });
    setEditUserPhoto(user.avatar || null);
    setError('');
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
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
    if (editUser.email !== editingUser.email && users.some(u => u.email === editUser.email && u.id !== editingUser.id)) {
      setError('Este email já está em uso');
      return;
    }
    if (editUser.password && editUser.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (editUser.password && editUser.password !== editUser.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    // Atualizar usuário
    const updatedUsers = users.map(u =>
      u.id === editingUser.id
        ? { ...u, name: editUser.name, email: editUser.email, role: editUser.role, avatar: editUserPhoto || undefined }
        : u
    );
    setUsers(updatedUsers);

    // Salvar no localStorage
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Atualizar senha no localStorage se fornecida
    if (editUser.password) {
      const usersWithPasswords = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');
      const userIndex = usersWithPasswords.findIndex((u: any) => u.id === editingUser.id);
      if (userIndex >= 0) {
        usersWithPasswords[userIndex].password = editUser.password;
      } else {
        usersWithPasswords.push({
          ...editingUser,
          password: editUser.password,
        });
      }
      localStorage.setItem('usersWithPasswords', JSON.stringify(usersWithPasswords));
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
    });
    setEditUserPhoto(null);
    if (editPhotoInputRef.current) {
      editPhotoInputRef.current.value = '';
    }
    setError('');
  };

  const handleDeleteUser = () => {
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

    // Salvar no localStorage
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Remover do localStorage de senhas
    const usersWithPasswords = JSON.parse(localStorage.getItem('usersWithPasswords') || '[]');
    const filteredPasswords = usersWithPasswords.filter((u: any) => u.id !== showDeleteConfirm);
    localStorage.setItem('usersWithPasswords', JSON.stringify(filteredPasswords));

    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Novo Usuário
          </button>
        )}
      </div>

      <div className="card">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Usuário</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="md" />
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{user.email}</td>
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
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && user.id !== currentUser?.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Criar Novo Usuário</h2>
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
                  });
                  setNewUserPhoto(null);
                  if (createPhotoInputRef.current) {
                    createPhotoInputRef.current.value = '';
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Foto do Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto do Usuário
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {newUserPhoto ? (
                      <div className="relative">
                        <img
                          src={newUserPhoto}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
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
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <User className="w-10 h-10 text-gray-400" />
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      {newUserPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Máximo 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Digite a senha novamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' | 'technician' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuário</option>
                  <option value="technician">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Editar Usuário</h2>
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Foto do Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto do Usuário
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {editUserPhoto ? (
                      <div className="relative">
                        <img
                          src={editUserPhoto}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
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
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <User className="w-10 h-10 text-gray-400" />
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      {editUserPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Máximo 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha (deixe em branco para manter a atual)
                </label>
                <input
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {editUser.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={editUser.confirmPassword}
                    onChange={(e) => setEditUser({ ...editUser, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Digite a senha novamente"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as 'admin' | 'user' | 'technician' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuário</option>
                  <option value="technician">Técnico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Excluir Usuário</h2>
                <p className="text-sm text-gray-600 mt-1">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Tem certeza que deseja excluir o usuário <strong>{users.find(u => u.id === showDeleteConfirm)?.name}</strong>?
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

