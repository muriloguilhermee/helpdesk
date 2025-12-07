# Guia de Implementação Backend para Integração ERP

## 📋 Visão Geral

Este documento descreve como implementar os endpoints de webhook no backend para que a integração com ERPs funcione em produção.

**Importante**: O código atual funciona apenas no frontend para demonstração. Para produção, você precisa implementar um backend real.

---

## 🏗️ Arquitetura Recomendada

### Opção 1: Backend Node.js/Express

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());

// Middleware de autenticação
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.ERP_API_KEY;
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'API Key inválida'
    });
  }
  
  next();
};

// Endpoint para receber webhook de boleto
app.post('/api/webhooks/erp/ticket', authenticateAPIKey, async (req, res) => {
  try {
    const erpData = req.body;
    
    // Validar dados
    const validation = validateERPTicketData(erpData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Dados inválidos: ${validation.errors.join(', ')}`
      });
    }
    
    // Processar ticket
    const result = await processERPTicket(erpData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao processar webhook de ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para receber webhook de pagamento
app.post('/api/webhooks/erp/payment', authenticateAPIKey, async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Validar dados
    const validation = validateERPPaymentData(paymentData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: `Dados inválidos: ${validation.errors.join(', ')}`
      });
    }
    
    // Processar pagamento
    const result = await processERPPayment(paymentData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao processar webhook de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

### Opção 2: Backend Python/Flask

```python
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

def authenticate_api_key(f):
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        valid_api_key = os.getenv('ERP_API_KEY')
        
        if not api_key or api_key != valid_api_key:
            return jsonify({
                'success': False,
                'message': 'API Key inválida'
            }), 401
        
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/api/webhooks/erp/ticket', methods=['POST'])
@authenticate_api_key
def handle_ticket_webhook():
    try:
        erp_data = request.json
        
        # Validar dados
        validation = validate_erp_ticket_data(erp_data)
        if not validation['valid']:
            return jsonify({
                'success': False,
                'message': f"Dados inválidos: {', '.join(validation['errors'])}"
            }), 400
        
        # Processar ticket
        result = process_erp_ticket(erp_data)
        
        return jsonify(result), 200
    except Exception as e:
        print(f'Erro ao processar webhook de ticket: {e}')
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor'
        }), 500

@app.route('/api/webhooks/erp/payment', methods=['POST'])
@authenticate_api_key
def handle_payment_webhook():
    try:
        payment_data = request.json
        
        # Validar dados
        validation = validate_erp_payment_data(payment_data)
        if not validation['valid']:
            return jsonify({
                'success': False,
                'message': f"Dados inválidos: {', '.join(validation['errors'])}"
            }), 400
        
        # Processar pagamento
        result = process_erp_payment(payment_data)
        
        return jsonify(result), 200
    except Exception as e:
        print(f'Erro ao processar webhook de pagamento: {e}')
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor'
        }), 500

if __name__ == '__main__':
    app.run(port=3000)
```

---

## 🔧 Funções de Processamento

### Processar Ticket do ERP

```javascript
async function processERPTicket(erpData) {
  // 1. Buscar ou criar cliente no banco de dados
  let client = await findUserByEmail(erpData.clientEmail);
  
  if (!client) {
    client = await createUser({
      name: erpData.clientName,
      email: erpData.clientEmail,
      role: 'user',
      company: erpData.clientDocument || null,
    });
  }
  
  // 2. Verificar se ticket já existe
  const existingTicket = await findFinancialTicketByErpId(
    erpData.erpId,
    erpData.erpType
  );
  
  if (existingTicket) {
    // Atualizar ticket existente
    await updateFinancialTicket(existingTicket.id, {
      amount: erpData.amount,
      dueDate: new Date(erpData.dueDate),
      title: erpData.title,
      description: erpData.description,
      client: client,
    });
    
    return {
      success: true,
      ticketId: existingTicket.id,
      message: 'Ticket atualizado com sucesso'
    };
  } else {
    // Criar novo ticket
    const newTicket = await createFinancialTicket({
      title: erpData.title,
      description: erpData.description,
      amount: erpData.amount,
      dueDate: new Date(erpData.dueDate),
      status: 'pending',
      client: client,
      createdBy: client,
      erpId: erpData.erpId,
      erpType: erpData.erpType,
      invoiceNumber: erpData.invoiceNumber,
      barcode: erpData.barcode,
      ourNumber: erpData.ourNumber,
      erpMetadata: erpData.metadata,
    });
    
    return {
      success: true,
      ticketId: newTicket.id,
      message: 'Ticket criado com sucesso'
    };
  }
}
```

### Processar Pagamento do ERP

```javascript
async function processERPPayment(paymentData) {
  // 1. Buscar ticket pelo erpId
  const ticket = await findFinancialTicketByErpId(
    paymentData.erpTicketId,
    paymentData.erpType
  );
  
  if (!ticket) {
    return {
      success: false,
      message: 'Ticket não encontrado para este pagamento'
    };
  }
  
  // 2. Atualizar status para pago
  await updateFinancialTicket(ticket.id, {
    status: 'paid',
    paymentDate: new Date(paymentData.paymentDate),
    paymentErpId: paymentData.erpId,
    paymentMethod: paymentData.paymentMethod,
    transactionId: paymentData.transactionId,
    paymentMetadata: paymentData.metadata,
  });
  
  return {
    success: true,
    message: 'Pagamento processado com sucesso'
  };
}
```

---

## 🗄️ Estrutura de Banco de Dados

### Tabela: financial_tickets

```sql
CREATE TABLE financial_tickets (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status ENUM('pending', 'paid', 'overdue', 'cancelled') NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  created_by_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Campos de integração ERP
  erp_id VARCHAR(255),
  erp_type ENUM('contaazul', 'bling', 'tiny', 'omie', 'other'),
  invoice_number VARCHAR(255),
  barcode VARCHAR(255),
  our_number VARCHAR(255),
  payment_erp_id VARCHAR(255),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  erp_metadata JSON,
  payment_metadata JSON,
  
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_erp_id (erp_id, erp_type),
  INDEX idx_client_id (client_id),
  INDEX idx_status (status)
);
```

---

## 🔒 Segurança

### 1. Autenticação

- Use HTTPS para todos os endpoints
- Valide API Key em todas as requisições
- Implemente rate limiting para prevenir abuso
- Use tokens JWT se necessário

### 2. Validação de Dados

- Valide todos os campos obrigatórios
- Sanitize inputs para prevenir SQL injection
- Valide formatos de data e valores monetários
- Limite tamanho de payloads

### 3. Logs e Monitoramento

- Registre todas as requisições recebidas
- Monitore tentativas de acesso não autorizadas
- Alerte sobre erros recorrentes
- Mantenha logs de auditoria

---

## 📝 Exemplo Completo de Implementação

Veja o arquivo `src/services/integrations/erpService.ts` para a implementação completa das funções de processamento.

---

## 🚀 Deploy

### Variáveis de Ambiente

```env
ERP_API_KEY=your-secret-api-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/helpdesk
NODE_ENV=production
PORT=3000
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

---

**Nota**: Esta é uma implementação de referência. Adapte conforme sua stack tecnológica e necessidades específicas.



