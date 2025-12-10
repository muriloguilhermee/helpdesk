# 🔧 Solução: Erro "XX000: {:shutdown, :db_termination}"

## 🔍 O que significa este erro?

O erro `XX000` com mensagem `{:shutdown, :db_termination}` indica que o banco de dados PostgreSQL foi **encerrado** ou está sendo **reiniciado**. Este é geralmente um problema **temporário**.

## ✅ Solução Passo a Passo

### Passo 1: Aguardar e tentar novamente (Mais Comum)

**90% dos casos são resolvidos apenas aguardando:**

1. Este erro geralmente acontece quando:
   - O Supabase está reiniciando o banco
   - Há manutenção programada
   - Muitas conexões simultâneas

2. **Aguarde 1-2 minutos**

3. Tente novamente:
   ```bash
   npm run test-connection
   ```

### Passo 2: Verificar status do projeto Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Verifique se há:
   - Notificações de manutenção
   - Alertas de status
   - Problemas reportados

4. Verifique os **Logs** do projeto:
   - Dashboard → Logs
   - Veja se há erros ou avisos

### Passo 3: Usar conexão direta (sem pooler)

O Connection Pooler pode estar sobrecarregado. Tente a conexão direta:

1. No Supabase Dashboard → Settings → Database
2. Em **Connection string**, selecione **URI** (não "Session mode")
3. Copie a connection string (porta 5432)
4. Cole no `server/.env` como `DATABASE_URL`
5. **Substitua `[SENHA]` pela senha real**
6. Teste: `npm run test-connection`

**Formato da conexão direta:**
```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres
```

### Passo 4: Verificar limites do plano

Planos gratuitos do Supabase têm limites:

1. **Conexões simultâneas**: Máximo de conexões ao mesmo tempo
2. **Timeout**: Conexões podem ser encerradas após inatividade

**Soluções:**
- Aguarde entre tentativas (não tente conectar várias vezes rapidamente)
- Considere fazer upgrade do plano se o problema persistir
- Use Connection Pooler (geralmente tem limites maiores)

### Passo 5: Reduzir conexões simultâneas

Se você tem múltiplas aplicações conectando:

1. Feche outras conexões ao banco
2. Aguarde alguns minutos
3. Tente conectar novamente

### Passo 6: Verificar configuração do pool

O servidor agora tenta reconectar automaticamente 3 vezes quando esse erro ocorre. Se ainda falhar:

1. Verifique se o `.env` está correto
2. Tente reiniciar o servidor:
   ```bash
   # Pare o servidor (Ctrl+C)
   # Aguarde 30 segundos
   npm run dev
   ```

## 🔄 Retry Automático

O servidor agora tem **retry automático** para esse erro:

- Tenta reconectar **3 vezes**
- Aguarda 5s, 10s, 15s entre tentativas
- Se ainda falhar após 3 tentativas, mostra o erro

## 📋 Checklist

- [ ] Aguardou 1-2 minutos e tentou novamente
- [ ] Verificou status do projeto no Supabase Dashboard
- [ ] Verificou logs do Supabase
- [ ] Tentou usar conexão direta (porta 5432)
- [ ] Verificou se há manutenção programada
- [ ] Reduziu conexões simultâneas
- [ ] Reiniciou o servidor após aguardar

## 🆘 Ainda não funciona?

1. **Crie um novo projeto** no Supabase
2. Use a connection string do novo projeto
3. Isso elimina qualquer problema de configuração

## 💡 Dica Final

**Este erro é quase sempre temporário.** 

- Aguarde alguns minutos
- Tente novamente
- Se persistir por mais de 10 minutos, pode ser problema no Supabase
- Verifique o status do Supabase: https://status.supabase.com

## 🔗 Links Úteis

- Status do Supabase: https://status.supabase.com
- Dashboard: https://app.supabase.com
- Documentação: https://supabase.com/docs

