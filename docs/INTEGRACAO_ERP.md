# Documentação de Integração com ERP

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Endpoints de Webhook](#endpoints-de-webhook)
5. [Formato dos Dados](#formato-dos-dados)
6. [Autenticação](#autenticação)
7. [Exemplos de Integração](#exemplos-de-integração)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Testes](#testes)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este sistema permite integração com ERPs (Enterprise Resource Planning) como **Conta Azul**, **Bling**, **Tiny**, **Omie** e outros, para sincronização automática de:

- **Boletos gerados**: Quando um boleto é criado no ERP, ele é automaticamente criado no sistema
- **Pagamentos confirmados**: Quando um pagamento é confirmado no ERP, o status do ticket financeiro é atualizado automaticamente para "pago"

### Fluxo de Integração

```
ERP → Webhook → Sistema Helpdesk → Atualização Automática
```

---

## 📦 Pré-requisitos

1. **Acesso de Administrador** no sistema Helpdesk
2. **Acesso ao painel de configuração do ERP** para configurar webhooks
3. **URL pública** do sistema Helpdesk (para receber webhooks)
4. **API Key** gerada no sistema (para autenticação)

---

## ⚙️ Configuração Inicial

### Passo 1: Gerar API Key

1. Acesse o sistema como **Administrador**
2. Vá em **Integração ERP** no menu lateral
3. Clique em **Gerar** para criar uma nova API Key
4. **Copie e salve** a API Key em local seguro
5. Clique em **Salvar** para confirmar

### Passo 2: Obter URLs de Webhook

No mesmo painel de **Integração ERP**, você encontrará duas URLs:

- **Webhook para Boletos**: `https://seu-dominio.com/api/webhooks/erp/ticket`
- **Webhook para Pagamentos**: `https://seu-dominio.com/api/webhooks/erp/payment`

**Importante**: Substitua `seu-dominio.com` pela URL real do seu sistema.

---

## 🔌 Endpoints de Webhook

### 1. Webhook de Boleto Criado

**Endpoint**: `POST /api/webhooks/erp/ticket`

**Descrição**: Recebe notificação quando um boleto é gerado no ERP.

**Headers**:
```
Content-Type: application/json
X-API-Key: sua-api-key-aqui
```

**Body** (JSON):
```json
{
  "erpId": "BOL-12345",
  "erpType": "contaazul",
  "title": "Fatura de Serviço - Janeiro 2024",
  "description": "Serviços prestados no mês de janeiro",
  "amount": 1500.00,
  "dueDate": "2024-02-15T00:00:00.000Z",
  "clientEmail": "cliente@exemplo.com",
  "clientName": "Cliente Exemplo Ltda",
  "clientDocument": "12.345.678/0001-90",
  "invoiceNumber": "NF-001234",
  "barcode": "34191090000000150001234567890123456789012345",
  "ourNumber": "000123456",
  "invoiceFileUrl": "https://erp.com/boletos/12345.pdf",
  "metadata": {
    "campoPersonalizado": "valor"
  }
}
```

**Campos Obrigatórios**:
- `erpId`: ID único do boleto no ERP
- `erpType`: Tipo do ERP (`contaazul`, `bling`, `tiny`, `omie`, `other`)
- `title`: Título/descrição do boleto
- `amount`: Valor do boleto (número)
- `dueDate`: Data de vencimento (ISO 8601)
- `clientEmail`: Email do cliente
- `clientName`: Nome do cliente

**Campos Opcionais**:
- `description`: Descrição adicional
- `clientDocument`: CPF/CNPJ do cliente
- `invoiceNumber`: Número da nota fiscal
- `barcode`: Código de barras
- `ourNumber`: Nosso número
- `invoiceFileUrl`: URL do PDF do boleto
- `metadata`: Objeto com dados adicionais

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "ticketId": "FT-1234567890",
  "message": "Ticket criado com sucesso"
}
```

**Resposta de Erro** (400):
```json
{
  "success": false,
  "message": "Dados inválidos: erpId é obrigatório, amount deve ser maior que zero"
}
```

---

### 2. Webhook de Pagamento Confirmado

**Endpoint**: `POST /api/webhooks/erp/payment`

**Descrição**: Recebe notificação quando um pagamento é confirmado no ERP.

**Headers**:
```
Content-Type: application/json
X-API-Key: sua-api-key-aqui
```

**Body** (JSON):
```json
{
  "erpId": "PAY-67890",
  "erpTicketId": "BOL-12345",
  "erpType": "contaazul",
  "paymentDate": "2024-02-10T14:30:00.000Z",
  "amount": 1500.00,
  "paymentMethod": "boleto",
  "transactionId": "TXN-98765",
  "receiptFileUrl": "https://erp.com/comprovantes/67890.pdf",
  "metadata": {
    "banco": "001",
    "agencia": "1234"
  }
}
```

**Campos Obrigatórios**:
- `erpId`: ID único do pagamento no ERP
- `erpTicketId`: ID do boleto no ERP (mesmo `erpId` usado no webhook de boleto)
- `erpType`: Tipo do ERP (deve ser o mesmo usado no boleto)
- `paymentDate`: Data do pagamento (ISO 8601)
- `amount`: Valor pago (número)

**Campos Opcionais**:
- `paymentMethod`: Método de pagamento (`boleto`, `pix`, `cartao`, etc.)
- `transactionId`: ID da transação
- `receiptFileUrl`: URL do comprovante de pagamento
- `metadata`: Objeto com dados adicionais

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "message": "Pagamento processado com sucesso"
}
```

**Resposta de Erro** (400):
```json
{
  "success": false,
  "message": "Ticket não encontrado para este pagamento"
}
```

---

## 📝 Formato dos Dados

### Tipos de ERP Suportados

- `contaazul`: Conta Azul
- `bling`: Bling
- `tiny`: Tiny ERP
- `omie`: Omie
- `other`: Outros ERPs

### Formato de Data

Todas as datas devem estar no formato **ISO 8601**:
```
2024-02-15T00:00:00.000Z
```

### Formato de Valores

Todos os valores monetários devem ser números (não strings):
```json
"amount": 1500.00  // ✅ Correto
"amount": "1500.00"  // ❌ Incorreto
```

---

## 🔐 Autenticação

Todas as requisições devem incluir a **API Key** no header:

```
X-API-Key: sua-api-key-gerada-no-sistema
```

**Importante**: 
- A API Key é única e deve ser mantida em segredo
- Se a API Key for comprometida, gere uma nova imediatamente
- A API Key é válida para todos os webhooks

---

## 💡 Exemplos de Integração

### Exemplo 1: Conta Azul

#### Configuração no Conta Azul

1. Acesse **Configurações** → **Integrações** → **Webhooks**
2. Adicione novo webhook:
   - **Evento**: "Boleto Gerado"
   - **URL**: `https://seu-dominio.com/api/webhooks/erp/ticket`
   - **Método**: POST
   - **Headers**: 
     ```
     Content-Type: application/json
     X-API-Key: sua-api-key
     ```

3. Configure o payload:
```json
{
  "erpId": "{{boleto.id}}",
  "erpType": "contaazul",
  "title": "{{boleto.titulo}}",
  "description": "{{boleto.descricao}}",
  "amount": {{boleto.valor}},
  "dueDate": "{{boleto.vencimento}}",
  "clientEmail": "{{cliente.email}}",
  "clientName": "{{cliente.nome}}",
  "clientDocument": "{{cliente.documento}}",
  "invoiceNumber": "{{notaFiscal.numero}}",
  "barcode": "{{boleto.codigoBarras}}",
  "ourNumber": "{{boleto.nossoNumero}}",
  "invoiceFileUrl": "{{boleto.urlPdf}}"
}
```

4. Adicione webhook para pagamento:
   - **Evento**: "Pagamento Confirmado"
   - **URL**: `https://seu-dominio.com/api/webhooks/erp/payment`
   - **Payload**:
```json
{
  "erpId": "{{pagamento.id}}",
  "erpTicketId": "{{boleto.id}}",
  "erpType": "contaazul",
  "paymentDate": "{{pagamento.data}}",
  "amount": {{pagamento.valor}},
  "paymentMethod": "{{pagamento.metodo}}",
  "transactionId": "{{pagamento.transacaoId}}"
}
```

### Exemplo 2: Bling

#### Configuração no Bling

1. Acesse **Configurações** → **API** → **Webhooks**
2. Configure webhook para "Nota Fiscal Emitida":
```json
{
  "erpId": "{{notaFiscal.id}}",
  "erpType": "bling",
  "title": "NF {{notaFiscal.numero}} - {{cliente.nome}}",
  "amount": {{notaFiscal.valorTotal}},
  "dueDate": "{{notaFiscal.vencimento}}",
  "clientEmail": "{{cliente.email}}",
  "clientName": "{{cliente.nome}}",
  "invoiceNumber": "{{notaFiscal.numero}}"
}
```

### Exemplo 3: Tiny ERP

#### Configuração no Tiny

1. Acesse **Configurações** → **Integrações** → **Webhooks**
2. Configure eventos:
   - **Boleto Criado** → `/api/webhooks/erp/ticket`
   - **Pagamento Recebido** → `/api/webhooks/erp/payment`

---

## ⚠️ Tratamento de Erros

### Códigos de Resposta HTTP

- **200 OK**: Requisição processada com sucesso
- **400 Bad Request**: Dados inválidos ou faltando campos obrigatórios
- **401 Unauthorized**: API Key inválida ou ausente
- **500 Internal Server Error**: Erro interno do servidor

### Estrutura de Erro

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": ["Lista de erros específicos"]
}
```

### Erros Comuns

1. **"API Key inválida"**
   - Verifique se a API Key está correta
   - Verifique se está sendo enviada no header `X-API-Key`

2. **"Dados inválidos"**
   - Verifique se todos os campos obrigatórios estão presentes
   - Verifique se os tipos de dados estão corretos (números, datas ISO)

3. **"Ticket não encontrado"**
   - Verifique se o `erpTicketId` corresponde ao `erpId` do boleto criado
   - Verifique se o `erpType` é o mesmo usado na criação do boleto

4. **"Cliente não encontrado"**
   - O sistema tentará criar o cliente automaticamente
   - Verifique se o email do cliente está correto

---

## 🧪 Testes

### Teste Manual via Interface

1. Acesse **Integração ERP** no sistema
2. Clique em **Testar Webhook de Boleto** para criar um ticket de teste
3. Clique em **Testar Webhook de Pagamento** para testar atualização de status

### Teste via cURL

#### Teste de Boleto:
```bash
curl -X POST https://seu-dominio.com/api/webhooks/erp/ticket \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-api-key" \
  -d '{
    "erpId": "TEST-001",
    "erpType": "contaazul",
    "title": "Boleto de Teste",
    "amount": 100.00,
    "dueDate": "2024-12-31T00:00:00.000Z",
    "clientEmail": "teste@exemplo.com",
    "clientName": "Cliente Teste"
  }'
```

#### Teste de Pagamento:
```bash
curl -X POST https://seu-dominio.com/api/webhooks/erp/payment \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-api-key" \
  -d '{
    "erpId": "PAY-001",
    "erpTicketId": "TEST-001",
    "erpType": "contaazul",
    "paymentDate": "2024-12-15T00:00:00.000Z",
    "amount": 100.00
  }'
```

### Teste via Postman

1. Crie uma nova requisição POST
2. URL: `https://seu-dominio.com/api/webhooks/erp/ticket`
3. Headers:
   - `Content-Type: application/json`
   - `X-API-Key: sua-api-key`
4. Body (raw JSON): Use o exemplo de payload acima

---

## 🔧 Troubleshooting

### Problema: Webhook não está sendo recebido

**Soluções**:
1. Verifique se a URL está correta e acessível publicamente
2. Verifique se o ERP está configurado para enviar webhooks
3. Verifique os logs do servidor para erros
4. Teste a URL manualmente via cURL ou Postman

### Problema: Ticket criado mas cliente não encontrado

**Solução**: O sistema criará automaticamente o cliente baseado no email. Verifique se o email está correto.

### Problema: Pagamento não atualiza o status

**Soluções**:
1. Verifique se o `erpTicketId` corresponde ao `erpId` do boleto
2. Verifique se o `erpType` é o mesmo
3. Verifique se o ticket existe no sistema

### Problema: API Key não funciona

**Soluções**:
1. Gere uma nova API Key no painel de integração
2. Atualize a configuração do webhook no ERP
3. Verifique se está enviando no header correto (`X-API-Key`)

---

## 📚 Estrutura de Dados no Sistema

### Ticket Financeiro Criado

Quando um boleto é recebido do ERP, o sistema cria um `FinancialTicket` com:

- **ID**: Gerado automaticamente (formato: `FT-{timestamp}`)
- **Título**: Do campo `title` do webhook
- **Valor**: Do campo `amount`
- **Vencimento**: Do campo `dueDate`
- **Status**: `pending` (pendente)
- **Cliente**: Criado ou encontrado pelo email
- **Metadados ERP**: Armazenados em `erpId`, `erpType`, `invoiceNumber`, etc.

### Atualização de Pagamento

Quando um pagamento é recebido:

- **Status**: Atualizado para `paid`
- **Data de Pagamento**: Do campo `paymentDate`
- **Metadados**: Armazenados em `paymentErpId`, `paymentMethod`, etc.

---

## 🔄 Fluxo Completo de Integração

### 1. Boleto Gerado no ERP

```
ERP → Webhook POST /api/webhooks/erp/ticket
     ↓
Sistema valida dados
     ↓
Sistema busca/cria cliente
     ↓
Sistema cria FinancialTicket
     ↓
Cliente vê boleto em "Financeiro"
```

### 2. Pagamento Confirmado no ERP

```
ERP → Webhook POST /api/webhooks/erp/payment
     ↓
Sistema busca ticket pelo erpTicketId
     ↓
Sistema atualiza status para "paid"
     ↓
Sistema atualiza data de pagamento
     ↓
Cliente vê status atualizado
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte esta documentação
2. Use a função de teste no painel de integração
3. Verifique os logs do sistema
4. Entre em contato com o suporte técnico

---

## 🔐 Segurança

### Boas Práticas

1. **Mantenha a API Key secreta**: Nunca compartilhe ou exponha em código público
2. **Use HTTPS**: Sempre configure webhooks com URLs HTTPS
3. **Valide dados**: O sistema valida todos os dados recebidos
4. **Monitore logs**: Acompanhe as requisições recebidas
5. **Rotacione API Keys**: Gere novas chaves periodicamente

### Recomendações

- Configure webhooks apenas de ERPs confiáveis
- Use IP whitelist se possível (configuração no servidor)
- Monitore tentativas de acesso não autorizadas
- Mantenha o sistema atualizado

---

## 📝 Notas Importantes

1. **Sincronização**: O sistema não envia dados de volta para o ERP. A integração é unidirecional (ERP → Sistema).

2. **Duplicatas**: O sistema verifica se já existe um ticket com o mesmo `erpId` e `erpType`. Se existir, atualiza ao invés de criar novo.

3. **Clientes**: Se o cliente não existir, será criado automaticamente com role "user". O email é usado como identificador único.

4. **Valores**: Todos os valores devem estar em Reais (BRL). O sistema formata automaticamente para exibição.

5. **Datas**: Use sempre formato ISO 8601. O sistema converte automaticamente para o fuso horário local.

---

## 🎯 Próximos Passos

Após configurar a integração:

1. ✅ Teste a criação de um boleto
2. ✅ Verifique se aparece na lista de tickets financeiros
3. ✅ Teste a confirmação de pagamento
4. ✅ Verifique se o status é atualizado automaticamente
5. ✅ Configure notificações (opcional)

---

**Última atualização**: Dezembro 2024

**Versão da Documentação**: 1.0

