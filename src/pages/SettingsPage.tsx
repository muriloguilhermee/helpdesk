import { Save, Bell, Lock, User, Globe } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, hasPermission } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'pt-BR',
  });

  const canEditSettings = hasPermission('edit:settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notificações */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Notificações no sistema</p>
                  <p className="text-sm text-gray-600">Receba notificações sobre atualizações de chamados</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  disabled={!canEditSettings}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Notificações por email</p>
                  <p className="text-sm text-gray-600">Receba notificações por email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  disabled={!canEditSettings}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Aparência */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Aparência</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Modo escuro</p>
                  <p className="text-sm text-gray-600">Ative o tema escuro</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                  disabled={!canEditSettings}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                />
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Perfil */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Perfil</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {canEditSettings && (
            <div className="flex justify-end">
              <button className="btn-primary flex items-center gap-2">
                <Save className="w-5 h-5" />
                Salvar Configurações
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Sistema</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-600">Versão</p>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-600">Última atualização</p>
              <p className="font-medium text-gray-900">15/01/2024</p>
            </div>
            <div>
              <p className="text-gray-600">Usuário logado</p>
              <p className="font-medium text-gray-900">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

