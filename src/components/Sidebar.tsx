import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  Settings,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  permission?: string;
  role?: 'admin' | 'user' | 'technician' | 'all';
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'view:dashboard', role: 'all' },
  { icon: Clock, label: 'Novos Chamados', path: '/tickets/pending', permission: 'view:pending:tickets', role: 'technician' },
  { icon: Ticket, label: 'Meus Chamados', path: '/tickets', permission: 'view:tickets', role: 'all' },
  { icon: PlusCircle, label: 'Novo Chamado', path: '/tickets/new', permission: 'create:ticket', role: 'all' },
  { icon: Users, label: 'Usuários', path: '/users', permission: 'view:users', role: 'all' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports', permission: 'view:reports', role: 'all' },
  { icon: Settings, label: 'Configurações', path: '/settings', permission: 'view:settings', role: 'all' },
];

export default function Sidebar() {
  const location = useLocation();
  const { hasPermission, user } = useAuth();
  const { tickets } = useTickets();

  // Contar novos chamados para técnicos
  const getNewTicketsCount = () => {
    if (user?.role !== 'technician') return 0;

    const newTickets = tickets.filter((ticket) => {
      const isPending = ticket.status === 'aberto' || ticket.status === 'pendente';
      const isAssignedToMe = ticket.assignedTo?.id === user.id;
      const isNotAssigned = !ticket.assignedTo;

      return isPending && (isAssignedToMe || isNotAssigned);
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
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 pt-16">
      <nav className="p-4">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {showNotification && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
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
  );
}

