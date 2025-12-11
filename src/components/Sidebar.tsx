import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  X,
  DollarSign,
  Wallet,
  Plug
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  permission?: string;
  role?: 'admin' | 'user' | 'technician' | 'financial' | 'all';
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'view:dashboard', role: 'all' },
  { icon: Clock, label: 'Novos Chamados', path: '/tickets/pending', permission: 'view:pending:tickets', role: 'technician' },
  { icon: Ticket, label: 'Meus Chamados', path: '/tickets', permission: 'view:tickets', role: 'all' },
  { icon: DollarSign, label: 'Financeiro', path: '/financial', permission: 'view:own:financial', role: 'all' },
  { icon: Wallet, label: 'Gestão Financeira', path: '/financial/management', permission: 'view:all:financial', role: 'all' },
  { icon: Plug, label: 'Integração ERP', path: '/erp-integration', permission: 'view:all:financial', role: 'admin' },
  { icon: Users, label: 'Usuários', path: '/users', permission: 'view:users', role: 'all' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports', permission: 'view:reports', role: 'all' },
  { icon: Settings, label: 'Configurações', path: '/settings', permission: 'view:settings', role: 'all' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { hasPermission, user } = useAuth();
  const { tickets } = useTickets();

  // Contar novos chamados para técnicos (todos com status "aberto")
  const getNewTicketsCount = () => {
    if (user?.role !== 'technician') return 0;

    // Contar todos os tickets com status "aberto" (aparecem para todos os técnicos)
    const newTickets = tickets.filter((ticket) => {
      return ticket.status === 'aberto';
    });

    return newTickets.length;
  };

  const newTicketsCount = getNewTicketsCount();

  // Filtrar itens do menu baseado em permissões e role
  const menuItems = allMenuItems.filter((item) => {
    // Verificar permissão
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }

    // Verificar role específico
    if (item.role && item.role !== 'all') {
      if (item.role === 'technician' && user?.role !== 'technician') {
        return false;
      }
      if (item.role !== 'technician' && user?.role === 'technician') {
        // Se o item não é para técnico mas o usuário é técnico, verificar se tem permissão
        if (!item.permission || !hasPermission(item.permission)) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo no topo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Logo size="md" showText={false} />
        </div>

        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            // Verificar se é o item de "Novos Chamados" e se tem novos chamados
            const isNewTicketsItem = item.path === '/tickets/pending';
            const showNotification = isNewTicketsItem && newTicketsCount > 0;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => {
                    // Fechar sidebar no mobile ao clicar em um link
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {showNotification && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    )}
                  </div>
                  <span>{item.label}</span>
                  {showNotification && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {newTicketsCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
    </>
  );
}

