import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Paperclip, X, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../contexts/TicketsContext';
import { Ticket, TicketPriority, TicketCategory, TicketFile, Queue } from '../types';
import { formatFileSize } from '../utils/formatFileSize';
import { database } from '../services/database';

export default function NewTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, addTicket } = useTickets();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    system: '',
    description: '',
    priority: 'media' as TicketPriority,
    category: 'suporte' as TicketCategory,
  });

  // Garantir que as filas padrão existem no banco de dados
  useEffect(() => {
    const ensureDefaultQueues = async () => {
      try {
        await database.init();
        const queues = await database.getQueues();
        const queueNames = queues.map((q: Queue) => q.name);
        
        // Criar Suporte N1 se não existir
        if (!queueNames.includes('Suporte N1')) {
          const suporteN1: Queue = {
            id: `queue-n1-${Date.now()}`,
            name: 'Suporte N1',
            description: 'Fila padrão de suporte nível 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await database.saveQueue(suporteN1);
        }
        
        // Criar Suporte N2 se não existir
        if (!queueNames.includes('Suporte N2')) {
          const suporteN2: Queue = {
            id: `queue-n2-${Date.now()}`,
            name: 'Suporte N2',
            description: 'Fila de suporte nível 2 (Desenvolvedores)',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await database.saveQueue(suporteN2);
        }
      } catch (error) {
        console.error('Erro ao verificar/criar filas padrão:', error);
      }
    };

    ensureDefaultQueues();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Limitar a 10 arquivos
    const remainingSlots = 10 - selectedFiles.length;
    if (files.length > remainingSlots) {
      alert(`Você pode anexar no máximo 10 arquivos. Você já tem ${selectedFiles.length} arquivo(s) selecionado(s).`);
      return;
    }

    setSelectedFiles([...selectedFiles, ...files.slice(0, remainingSlots)]);

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const convertFileToTicketFile = async (file: File, index: number): Promise<TicketFile> => {
    // Em produção, aqui você faria upload para o servidor
    // Por enquanto, vamos converter para base64 para demonstração
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string, // Base64
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Você precisa estar logado para criar um chamado.');
      return;
    }

    try {
      // Gerar ID no formato 00001, 00002, etc.
      const existingIds = tickets.map(t => {
        const numId = parseInt(t.id.replace(/^0+/, '') || '0');
        return isNaN(numId) ? 0 : numId;
      });
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      const ticketId = String(maxId + 1).padStart(5, '0');

      // Converter arquivos
      const ticketFiles: TicketFile[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const ticketFile = await convertFileToTicketFile(selectedFiles[i], i);
        ticketFiles.push(ticketFile);
      }

      const newTicket: Ticket = {
        id: ticketId,
        title: formData.title,
        system: formData.system || undefined,
        description: formData.description,
        status: 'aberto',
        priority: formData.priority,
        category: formData.category,
        client: user,
        createdBy: user,
        queue: 'Suporte N1', // Atribuir automaticamente à fila Suporte N1
        createdAt: new Date(),
        updatedAt: new Date(),
        files: ticketFiles.length > 0 ? ticketFiles : undefined,
      };

      // Adicionar o ticket
      addTicket(newTicket);
      
      // Aguardar um pouco para garantir que o salvamento foi concluído
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirecionar para a lista de chamados
      navigate('/tickets');
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      alert('Erro ao criar chamado. Por favor, tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="self-start p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Novo Chamado</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Crie um novo chamado de suporte</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card dark:bg-gray-800 dark:border-gray-700 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título do Chamado
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Descreva brevemente o problema"
            />
          </div>

          <div>
            <label htmlFor="system" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sistema
            </label>
            <select
              id="system"
              value={formData.system}
              onChange={(e) => setFormData({ ...formData, system: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Selecione o sistema</option>
              <option value="ClouddChat v1">ClouddChat v1</option>
              <option value="ClouddChat v2">ClouddChat v2</option>
              <option value="ClouddVoz">ClouddVoz</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Descreva o problema em detalhes..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="suporte">Suporte</option>
                <option value="tecnico">Técnico</option>
                <option value="integracao">Integração</option>
                <option value="melhoria">Melhoria</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          {/* Upload de Arquivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anexar Arquivos (Evidências)
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                {selectedFiles.length}/10 arquivos
              </span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                selectedFiles.length >= 10
                  ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={selectedFiles.length >= 10}
              />
              {selectedFiles.length >= 10 ? (
                <div className="flex flex-col items-center justify-center">
                  <Paperclip className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Limite de 10 arquivos atingido
                  </span>
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Paperclip className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Clique para selecionar arquivos
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Máximo de 10 arquivos
                  </span>
                </label>
              )}
            </div>

            {/* Lista de arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Arquivos selecionados:</p>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                        title="Remover arquivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              Criar Chamado
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


