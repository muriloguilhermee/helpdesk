# 🎫 Sistema Helpdesk - EVA cloudd

Sistema completo de gestão de chamados (helpdesk) com módulo financeiro e integração com ERP.

## ✨ Funcionalidades Principais

### 🎯 Gestão de Chamados
- Criação, edição e acompanhamento de chamados
- Atribuição de técnicos
- Sistema de comentários
- Upload de arquivos
- Múltiplos status e prioridades
- Categorias: Suporte, Técnico, Integração, Melhoria

### 💰 Módulo Financeiro
- Gestão de tickets financeiros
- Controle de boletos e pagamentos
- Download de boletos para clientes
- Relatórios financeiros
- Integração automática com ERP

### 🔌 Integração com ERP
- Suporte a múltiplos ERPs (Conta Azul, Bling, Tiny, Omie)
- Webhooks automáticos
- Sincronização de boletos e pagamentos
- API Key para autenticação

### 👥 Gestão de Usuários
- Criação e edição de usuários
- Múltiplos perfis (Admin, Técnico, Usuário, Financeiro)
- Upload de foto de perfil
- Edição de perfil do administrador

### 📊 Relatórios e Dashboard
- Dashboard com estatísticas em tempo real
- Relatórios detalhados
- Gráficos de pizza por categoria, prioridade e status
- Exportação em PDF e Excel
- Relatórios por técnico

### 🔔 Notificações
- Sistema completo de notificações
- Notificações de login/logout
- Notificações de criação e atualização de chamados
- Som de notificação no navegador
- Notificações do navegador

### 🎨 Interface
- Modo escuro/claro
- Design responsivo (mobile, tablet, desktop)
- Suporte a múltiplos idiomas (PT-BR, EN-US, ES-ES)
- Busca avançada
- Filtros por status, prioridade e categoria

## 🗄️ Banco de Dados

O sistema utiliza **IndexedDB** para armazenamento persistente e robusto:

- ✅ **Sincronização consistente** entre diferentes navegadores
- ✅ **Migração automática** de dados do localStorage
- ✅ **Estrutura preparada** para migração futura para banco de dados real
- ✅ **Performance otimizada** para grandes volumes de dados

### Estrutura de Dados

- **users**: Usuários do sistema
- **tickets**: Chamados de suporte
- **financialTickets**: Tickets financeiros
- **settings**: Configurações
- **notifications**: Notificações

## 🚀 Tecnologias

- **React 18** com TypeScript
- **Vite** para build
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **IndexedDB** para banco de dados local
- **jsPDF** para exportação de PDF
- **Lucide React** para ícones

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔐 Usuários Padrão

### Administrador
- **Email**: `muriloguilherme@evacloudd.com`
- **Senha**: `Eloah@210818`

### Outros Usuários
- Ver `src/data/mockData.ts` para lista completa

## 📚 Documentação

Consulte a pasta `docs/` para documentação completa:

- **[Integração ERP](./docs/INTEGRACAO_ERP.md)**: Guia de integração com ERPs
- **[Implementação Backend](./docs/IMPLEMENTACAO_BACKEND.md)**: Guia técnico para backend
- **[Changelog](./docs/CHANGELOG.md)**: Histórico de mudanças

## 🎯 Próximos Passos

1. **Migração para banco de dados real** (PostgreSQL, MySQL, etc.)
2. **API REST completa** para backend
3. **Autenticação JWT** mais robusta
4. **Upload de arquivos** para servidor
5. **Email notifications** reais

## 📝 Licença

Este projeto é privado e proprietário.

---

**Desenvolvido para EVA cloudd** 🚀
