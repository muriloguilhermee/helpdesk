import { Search, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../utils/userAvatar';
import NotificationsDropdown from './NotificationsDropdown';

interface HeaderProps {
  onMenuClick?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  technician_n2: 'Técnico n2',
  user: 'Usuário',
  financial: 'Financeiro',
};

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState(() => {
    // Carregar busca do localStorage se existir
    return localStorage.getItem('dashboardSearchQuery') || '';
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 lg:z-50">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Menu hambúrguer para mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Busca funcional - centralizada */}
          <div className="hidden sm:flex items-center flex-1 max-w-2xl mx-auto">
            <div className="relative w-full flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar chamados por título ou descrição..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    // Salvar no localStorage para compartilhar com Dashboard
                    localStorage.setItem('dashboardSearchQuery', value);
                    // Disparar evento customizado para atualizar Dashboard
                    window.dispatchEvent(new Event('dashboardSearchChange'));
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    localStorage.removeItem('dashboardSearchQuery');
                    // Disparar evento customizado para atualizar Dashboard
                    window.dispatchEvent(new Event('dashboardSearchChange'));
                  }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Limpar busca"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 lg:ml-6">
            <NotificationsDropdown />

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 lg:gap-3 lg:pl-4 lg:border-l lg:border-gray-200 lg:dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                <UserAvatar user={user} size="sm" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[user.role]}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden lg:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{roleLabels[user.role]}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

