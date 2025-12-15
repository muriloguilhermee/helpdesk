import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketsList from './pages/TicketsList';
import AllTickets from './pages/AllTickets';
import NewTicket from './pages/NewTicket';
import TicketDetails from './pages/TicketDetails';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PendingTickets from './pages/PendingTickets';
import FinancialTicketsPage from './pages/FinancialTicketsPage';
import FinancialManagementPage from './pages/FinancialManagementPage';
import ERPIntegrationPage from './pages/ERPIntegrationPage';

function AppRoutes() {
  const { isAuthenticated, user, hasPermission } = useAuth();

  // Determinar a rota inicial baseada nas permissões
  const getInitialRoute = () => {
    if (!user) return '/login';
    if (hasPermission('view:dashboard')) return '/';
    if (hasPermission('view:tickets')) return '/tickets';
    return '/tickets/new';
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getInitialRoute()} replace /> : <Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={
          hasPermission('view:dashboard')
            ? <ProtectedRoute requiredPermission="view:dashboard"><Dashboard /></ProtectedRoute>
            : <Navigate to="/tickets" replace />
        } />
        <Route path="tickets" element={<ProtectedRoute requiredPermission="view:tickets"><TicketsList /></ProtectedRoute>} />
        <Route path="tickets/all" element={<ProtectedRoute requiredPermission="view:tickets"><AllTickets /></ProtectedRoute>} />
        <Route path="tickets/pending" element={<ProtectedRoute requiredPermission="view:pending:tickets"><PendingTickets /></ProtectedRoute>} />
        <Route path="tickets/new" element={<ProtectedRoute requiredPermission="create:ticket"><NewTicket /></ProtectedRoute>} />
        <Route path="tickets/:id" element={<ProtectedRoute requiredPermission="view:tickets"><TicketDetails /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute requiredPermission="view:users"><UsersPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute requiredPermission="view:reports"><ReportsPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute requiredPermission="view:settings"><SettingsPage /></ProtectedRoute>} />
        <Route path="financial" element={<ProtectedRoute requiredPermission="view:own:financial"><FinancialTicketsPage /></ProtectedRoute>} />
        <Route path="financial/management" element={<ProtectedRoute requiredPermission="view:all:financial"><FinancialManagementPage /></ProtectedRoute>} />
        <Route path="erp-integration" element={<ProtectedRoute requiredPermission="view:all:financial"><ERPIntegrationPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;


