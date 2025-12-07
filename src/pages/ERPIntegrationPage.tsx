import { useState } from 'react';
import { Settings, Key, Webhook, FileText, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinancial } from '../contexts/FinancialContext';
import { handleERPTicketWebhook, handleERPPaymentWebhook } from '../api/webhooks/erpWebhooks';
import { ERPTicketData, ERPPaymentData } from '../services/integrations/erpService';

export default function ERPIntegrationPage() {
  const { hasPermission, user } = useAuth();
  const { financialTickets, addFinancialTicket, updateFinancialTicket } = useFinancial();
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('erpApiKey') || '';
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Buscar todos os usuários
  const allUsers = (() => {
    const savedUsers = localStorage.getItem('allUsers');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const generateApiKey = () => {
    const newKey = `erp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    localStorage.setItem('erpApiKey', newKey);
    setWebhookUrl(`${window.location.origin}/api/webhooks/erp`);
  };

  const saveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('erpApiKey', apiKey);
      alert('API Key salva com sucesso!');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  const testTicketWebhook = async () => {
    const testData: ERPTicketData = {
      erpId: `TEST-${Date.now()}`,
      erpType: 'contaazul',
      title: 'Teste de Integração - Boleto',
      description: 'Boleto de teste criado via integração',
      amount: 100.00,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      clientEmail: user?.email || 'teste@exemplo.com',
      clientName: user?.name || 'Usuário Teste',
    };

    const result = await handleERPTicketWebhook(
      testData,
      financialTickets,
      addFinancialTicket,
      updateFinancialTicket,
      allUsers
    );

    setTestResult(result);
  };

  const testPaymentWebhook = async () => {
    // Buscar um ticket de teste
    const testTicket = financialTickets.find((t: any) => t.erpId);
    
    if (!testTicket) {
      setTestResult({
        success: false,
        message: 'Nenhum ticket com erpId encontrado. Crie um ticket de teste primeiro.',
      });
      return;
    }

    const testData: ERPPaymentData = {
      erpId: `PAY-${Date.now()}`,
      erpTicketId: (testTicket as any).erpId,
      erpType: (testTicket as any).erpType || 'contaazul',
      paymentDate: new Date().toISOString(),
      amount: testTicket.amount,
      paymentMethod: 'boleto',
    };

    const result = await handleERPPaymentWebhook(
      testData,
      financialTickets,
      updateFinancialTicket
    );

    setTestResult(result);
  };

  if (!hasPermission('view:all:financial') && user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Você não tem permissão para acessar esta página</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Integração com ERP</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Configure a integração com sistemas ERP como Conta Azul, Bling, Tiny, Omie, etc.
        </p>
      </div>

      {/* Configuração de API Key */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API Key</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chave de API
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Gere ou cole sua API Key"
              />
              <button
                onClick={generateApiKey}
                className="btn-secondary flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Gerar
              </button>
              <button
                onClick={saveApiKey}
                className="btn-primary"
                disabled={!apiKey}
              >
                Salvar
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use esta chave para autenticar as requisições do ERP
            </p>
          </div>
        </div>
      </div>

      {/* URLs de Webhook */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">URLs de Webhook</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook para Boletos (POST)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl || `${window.location.origin}/api/webhooks/erp/ticket`}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl || `${window.location.origin}/api/webhooks/erp/ticket`)}
                className="btn-secondary flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook para Pagamentos (POST)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl || `${window.location.origin}/api/webhooks/erp/payment`}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl || `${window.location.origin}/api/webhooks/erp/payment`)}
                className="btn-secondary flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Testes */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Testes de Integração</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={testTicketWebhook}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Testar Webhook de Boleto
            </button>
            <button
              onClick={testPaymentWebhook}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Testar Webhook de Pagamento
            </button>
          </div>
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <p className={`text-sm ${
                  testResult.success 
                    ? 'text-green-800 dark:text-green-400' 
                    : 'text-red-800 dark:text-red-400'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Informações</h2>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• Configure os webhooks no seu ERP apontando para as URLs acima</p>
          <p>• Use a API Key gerada no header <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">X-API-Key</code> das requisições</p>
          <p>• Consulte a documentação completa em <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">/docs/integracao-erp.md</code></p>
        </div>
      </div>
    </div>
  );
}



