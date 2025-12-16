import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [LOGIN] handleSubmit chamado', { email, password: '***' });
    setError('');
    setIsLoading(true);

    try {
      console.log('🚀 [LOGIN] Chamando função login...');
      const success = await login(email, password);
      console.log('🚀 [LOGIN] Resultado do login:', success);

      if (success) {
        console.log('🚀 [LOGIN] Login bem-sucedido, redirecionando...');
        navigate('/');
      } else {
        console.log('🚀 [LOGIN] Login falhou (retornou false)');
        setError('Email ou senha incorretos');
      }
    } catch (err: any) {
      console.error('🚀 [LOGIN] Erro capturado:', err);
      // Mostrar mensagem de erro mais específica
      let errorMessage = err.message || 'Erro ao fazer login. Tente novamente.';
      console.error('🚀 [LOGIN] Mensagem de erro:', errorMessage);

      // Tratamento específico para erro 429
      if (err.status === 429 || errorMessage.includes('Muitas requisições')) {
        errorMessage = 'Muitas requisições. O servidor está temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.';
      }

      setError(errorMessage);

      // Se for erro de backend não configurado, mostrar instruções
      if (errorMessage.includes('Backend não configurado') || errorMessage.includes('backend está rodando')) {
        setError(`${errorMessage}\n\nInicie o backend com: cd server && npm run dev`);
      }
    } finally {
      setIsLoading(false);
      console.log('🚀 [LOGIN] handleSubmit finalizado');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 sm:space-y-8">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex items-center">
                <div className="flex items-center text-3xl">
                  {/* Eva - cinza claro, bold, itálico */}
                  <span className="font-bold text-gray-400 dark:text-gray-500 italic tracking-tight">
                    Eva
                  </span>
                  {/* Cloudd - azul vibrante, bold, primeira letra maiúscula */}
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    Cloudd
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bem-vindo</h1>
            <p className="text-gray-600 dark:text-gray-400">Faça login para acessar o sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

