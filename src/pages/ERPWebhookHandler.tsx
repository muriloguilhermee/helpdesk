import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinancial } from '../contexts/FinancialContext';
import { handleERPTicketWebhook, handleERPPaymentWebhook } from '../api/webhooks/erpWebhooks';
import { ERPTicketData, ERPPaymentData } from '../services/integrations/erpService';

/**
 * Página para processar webhooks do ERP
 * Em produção, isso seria um endpoint de backend
 */
export default function ERPWebhookHandler() {
  const { type } = useParams<{ type: 'ticket' | 'payment' }>();
  const navigate = useNavigate();
  const { financialTickets, addFinancialTicket, updateFinancialTicket } = useFinancial();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Em produção, isso seria processado no backend
    // Aqui estamos simulando o processamento via URL params ou localStorage
    const processWebhook = async () => {
      try {
        // Buscar dados do webhook do localStorage (simulação)
        const webhookData = localStorage.getItem('pendingWebhook');
        if (!webhookData) {
          setResult({
            success: false,
            message: 'Nenhum webhook pendente encontrado',
          });
          setLoading(false);
          return;
        }

        const data = JSON.parse(webhookData);
        const apiKey = localStorage.getItem('erpApiKey');

        // Validar API Key
        if (data.apiKey && apiKey && data.apiKey !== apiKey) {
          setResult({
            success: false,
            message: 'API Key inválida',
          });
          setLoading(false);
          return;
        }

        if (type === 'ticket') {
          const ticketData: ERPTicketData = data.payload;
          const result = await handleERPTicketWebhook(
            ticketData,
            financialTickets,
            addFinancialTicket,
            updateFinancialTicket,
            allUsers
          );
          setResult(result);
        } else if (type === 'payment') {
          const paymentData: ERPPaymentData = data.payload;
          const result = await handleERPPaymentWebhook(
            paymentData,
            financialTickets,
            updateFinancialTicket
          );
          setResult(result);
        }

        // Limpar webhook processado
        localStorage.removeItem('pendingWebhook');
        setLoading(false);
      } catch (error) {
        setResult({
          success: false,
          message: `Erro ao processar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        });
        setLoading(false);
      }
    };

    processWebhook();
  }, [type, financialTickets, addFinancialTicket, updateFinancialTicket, allUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processando webhook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className={`flex items-center gap-3 ${
          result?.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {result?.success ? (
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">
              {result?.success ? 'Webhook Processado' : 'Erro ao Processar'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {result?.message}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/financial/management')}
          className="w-full btn-primary"
        >
          Voltar para Gestão Financeira
        </button>
      </div>
    </div>
  );
}

