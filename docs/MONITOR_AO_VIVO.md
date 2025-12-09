# 📡 Monitor ao Vivo - Documentação

## 🎯 Funcionalidade

O **Monitor ao Vivo** é uma tela exclusiva para administradores que permite acompanhar todos os chamados em tempo real, com atualizações automáticas e notificações.

## ✨ Recursos Implementados

### 1. **Atualização em Tempo Real**
- ✅ Atualização automática a cada 1s, 3s, 5s ou 10s (configurável)
- ✅ Indicador visual de status (Ativo/Pausado)
- ✅ Última atualização exibida
- ✅ Controle de play/pause

### 2. **Estatísticas em Tempo Real**
- Total de chamados
- Chamados abertos
- Chamados em atendimento
- Chamados críticos
- E mais...

### 3. **Lista de Chamados Recentes**
- Lista atualizada automaticamente
- Ordenação por data de atualização
- Cards clicáveis para ver detalhes
- Informações visuais de status e prioridade

### 4. **Atividades Recentes**
- Timeline de atividades em tempo real
- Detecção de:
  - Novos chamados criados
  - Mudanças de status
  - Atribuições de técnicos
  - Atualizações gerais
- Som de notificação para novas atividades

### 5. **Filtros e Busca**
- Busca por título, descrição ou ID
- Filtro por status
- Filtro por prioridade
- Painel de filtros expansível

### 6. **Notificações**
- Contador de novos chamados
- Som de notificação
- Indicador visual
- Botão para limpar notificações

## 🚀 Como Usar

### Acessar o Monitor

1. Faça login como **administrador**
2. No menu lateral, clique em **"Monitor ao Vivo"**
3. A tela será carregada automaticamente

### Controles

- **Play/Pausar**: Clique no botão para pausar ou retomar atualizações
- **Intervalo**: Selecione a frequência de atualização (1s, 3s, 5s, 10s)
- **Filtros**: Clique em "Filtros" para expandir opções de filtragem
- **Busca**: Digite na barra de busca para filtrar chamados
- **Notificações**: Clique no sino para limpar notificações

### Visualizações

#### Estatísticas
Cards no topo mostram:
- Total de chamados
- Chamados abertos
- Chamados em atendimento
- Chamados críticos

#### Lista de Chamados
- Cards com informações principais
- Status e prioridade visíveis
- Clique para ver detalhes completos
- Ordenação por atualização mais recente

#### Atividades Recentes
- Timeline de eventos
- Ícones por tipo de atividade
- Timestamp de cada evento
- Links para os chamados

## 🔧 Configuração Técnica

### Atualização Automática

O monitor usa **polling** para buscar atualizações:

```typescript
// Intervalo configurável
const refreshInterval = 3000; // 3 segundos

// Busca tickets da API
const updatedTickets = await api.getTickets();
```

### Detecção de Mudanças

O sistema compara o estado anterior com o atual para detectar:
- Novos chamados
- Mudanças de status
- Atribuições
- Atualizações gerais

### Notificações

- **Visual**: Contador no botão de notificações
- **Sonora**: Som de beep quando há novas atividades
- **Timeline**: Atividades aparecem na lateral direita

## 🎨 Interface

### Layout

```
┌─────────────────────────────────────────┐
│  Header (Status, Controles, Notificações) │
├─────────────────────────────────────────┤
│  Busca e Filtros                        │
├─────────────────────────────────────────┤
│  Estatísticas (4 cards)                 │
├──────────────┬──────────────────────────┤
│              │                          │
│  Chamados    │  Atividades              │
│  Recentes    │  Recentes                │
│  (Lista)     │  (Timeline)              │
│              │                          │
└──────────────┴──────────────────────────┘
```

### Cores e Status

- **Aberto**: Vermelho
- **Em Atendimento**: Azul
- **Pendente**: Laranja
- **Resolvido**: Verde
- **Fechado**: Cinza

### Prioridades

- **Crítica**: Vermelho
- **Alta**: Laranja
- **Média**: Azul
- **Baixa**: Cinza

## 🔐 Permissões

Apenas **administradores** podem acessar o Monitor ao Vivo.

Verificação automática:
- Se não for admin, redireciona para dashboard
- Rota protegida no App.tsx

## 📊 Performance

### Otimizações

1. **Limite de Atividades**: Mantém apenas as últimas 50 atividades
2. **Filtros no Cliente**: Filtragem feita localmente após buscar
3. **Debounce**: Evita múltiplas requisições simultâneas
4. **Lazy Loading**: Carrega apenas 20 chamados por vez na lista

### Recomendações

- Use intervalo de 3-5 segundos para melhor performance
- Pause quando não estiver usando
- Limite a busca para reduzir carga

## 🚀 Melhorias Futuras

### Possíveis Adições

1. **WebSockets**: Substituir polling por WebSockets para atualização instantânea
2. **Gráficos**: Adicionar gráficos de tendência
3. **Exportação**: Exportar relatório do monitor
4. **Alertas**: Configurar alertas para eventos específicos
5. **Filtros Salvos**: Salvar combinações de filtros
6. **Modo Tela Cheia**: Opção de tela cheia para monitoramento
7. **Histórico**: Ver histórico de atividades de um período

## 🐛 Troubleshooting

### Atualizações não funcionam

1. Verifique se está pausado
2. Verifique a conexão com a API
3. Verifique o console do navegador para erros

### Notificações não aparecem

1. Verifique se há novos chamados
2. Limpe o cache do navegador
3. Verifique permissões de notificação do navegador

### Performance lenta

1. Aumente o intervalo de atualização
2. Use filtros para reduzir quantidade de dados
3. Pause quando não estiver usando

## 📝 Notas

- O monitor funciona melhor com backend rodando (API)
- Em modo local, ainda funciona mas com limitações
- Recomendado usar em tela secundária para monitoramento contínuo

---

**Desenvolvido para facilitar o monitoramento e gestão de chamados em tempo real! 🚀**


