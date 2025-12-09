# 🎫 Sistema Helpdesk - EvaCloudd

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

O sistema suporta **dois modos de armazenamento**:

### Modo Local (IndexedDB)
- ✅ Funciona sem configuração
- ✅ Dados salvos no navegador
- ✅ Ideal para desenvolvimento e testes

### Modo Produção (PostgreSQL/Supabase)
- ✅ Banco de dados real na nuvem
- ✅ Dados persistentes e seguros
- ✅ Pronto para produção

**O sistema detecta automaticamente** qual modo usar baseado nas variáveis de ambiente.

### Estrutura de Dados

- **users**: Usuários do sistema
- **tickets**: Chamados de suporte
- **comments**: Comentários nos chamados
- **interactions**: Histórico de interações
- **ticket_files**: Arquivos anexados
- **queues**: Filas de atendimento

## 🚀 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Lucide React** para ícones
- **jsPDF** para exportação de PDF

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Knex.js** (Query Builder)
- **PostgreSQL** (Supabase)
- **JWT** para autenticação
- **bcryptjs** para hash de senhas

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

### Deploy e Configuração
- **[Deploy Supabase](./DEPLOY_SUPABASE.md)**: Guia completo de deploy
- **[Quick Start](./QUICK_START_SUPABASE.md)**: Deploy rápido (5 minutos)
- **[Deploy HostGator](./docs/DEPLOY_HOSTGATOR.md)**: Deploy em servidor próprio

### Funcionalidades
- **[Integração ERP](./docs/INTEGRACAO_ERP.md)**: Guia de integração com ERPs
- **[Implementação Backend](./docs/IMPLEMENTACAO_BACKEND.md)**: Guia técnico para backend
- **[Monitor ao Vivo](./docs/MONITOR_AO_VIVO.md)**: Documentação do monitor
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

**Desenvolvido para EvaCloudd** 🚀
