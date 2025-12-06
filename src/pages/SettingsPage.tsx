import { Save, Bell, Lock, User, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsPage() {
  const { user, hasPermission } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          notifications: parsed.notifications !== undefined ? parsed.notifications : true,
          emailNotifications: parsed.emailNotifications !== undefined ? parsed.emailNotifications : true,
        });
      } catch {
        // Se houver erro, usar padrões
      }
    }
  }, []);

  const canEditSettings = hasPermission('edit:settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notificações */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notificações</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Notificações no sistema</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receba notificações sobre atualizações de chamados</p>
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
                  <p className="font-medium text-gray-900 dark:text-gray-100">Notificações por email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receba notificações por email</p>
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
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Aparência</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Modo escuro</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {darkMode ? 'Tema escuro ativado' : 'Tema claro ativado'}
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => {
                      toggleDarkMode();
                    }}
                    disabled={!canEditSettings}
                    className="sr-only"
                    id="dark-mode-toggle"
                  />
                  <label
                    htmlFor="dark-mode-toggle"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    } ${!canEditSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </label>
                </div>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'pt-BR' | 'en-US' | 'es-ES';
                    setLanguage(newLanguage);
                  }}
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>
          </div>

          {/* Perfil */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Perfil</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="card dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Segurança</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nova senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={!canEditSettings}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {canEditSettings && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  // Salvar configurações no localStorage
                  localStorage.setItem('settings', JSON.stringify(settings));
                  // Mostrar feedback (opcional)
                  alert('Configurações salvas com sucesso!');
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Configurações
              </button>
            </div>
          )}
        </div>

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Informações do Sistema</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Versão</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Última atualização</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">15/01/2024</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Usuário logado</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

