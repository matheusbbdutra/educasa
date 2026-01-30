# 📊 Monitoramento de Erros com Sentry

Este projeto utiliza o Sentry Cloud para monitoramento de erros e performance em tempo real.

## 🚀 Configuração Rápida

### 1. Obtenha seu DSN do Sentry

1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta ou faça login
3. Crie um novo projeto (selecione "Vue.js" ou "Node.js")
4. Copie o DSN (Data Source Name) das configurações do projeto

### 2. Configure o Projeto

Use o script automático:

```bash
./scripts/setup-sentry.sh
```

Ou configure manualmente adicionando ao seu arquivo `.env`:

```env
# Sentry Configuration
SENTRY_DSN="https://your-dsn-here"
SENTRY_ENVIRONMENT="development"
```

### 3. Reinicie o Servidor

```bash
npm run dev
```

## 🧪 Teste a Integração

Acesse a página de teste: `http://localhost:3000/test-sentry`

Nesta página você pode:
- Verificar o status do Sentry
- Testar diferentes tipos de erros
- Verificar logs em tempo real
- Testar contexto de usuário

## 📋 Funcionalidades Implementadas

### ✅ Captura Automática de Erros

- **Erros JavaScript**: Captura todos os erros não tratados no frontend
- **Erros de API**: Captura erros de requisições HTTP
- **Erros de Servidor**: Captura erros no backend Nitro
- **Promises Rejeitadas**: Captura `unhandledrejection`
- **Erros Vue**: Captura erros em componentes Vue

### ✅ Contexto Automático

- **Informações do Usuário**: ID, email, role quando autenticado
- **Dados da Requisição**: Método, URL, headers
- **Informações do Browser**: User agent, linguagem, plataforma
- **Dados do Servidor**: Versão Node.js, plataforma, arquitetura

### ✅ Performance Monitoring

- **Transações HTTP**: Monitora tempo de resposta das APIs
- **Breadcrumbs**: Rastreia ações do usuário antes do erro
- **Tags**: Classifica erros por tipo, ambiente, role do usuário

## 🔧 Uso Avançado

### Logger Personalizado

Use o Logger personalizado para melhor controle:

```typescript
import { Logger } from '~/utils/logger'

// Logs informativos
Logger.info('Usuário logou com sucesso', { userId: '123' })

// Logs de aviso
Logger.warn('Senha fraca detectada', { userId: '123' })

// Logs de erro
Logger.error(error, { 
  context: 'login_process',
  userId: '123' 
})

// Erros de API
Logger.apiError(error, '/api/auth/login', 'POST')

// Contexto de usuário
Logger.setUser({ id: '123', email: 'user@example.com', role: 'STUDENT' })

// Tags e contexto personalizados
Logger.setTag('feature', 'authentication')
Logger.setContext('payment', { amount: 100, currency: 'BRL' })
```

### Captura Manual de Erros

```typescript
try {
  // Seu código
} catch (error) {
  Logger.error(error, {
    component: 'UserProfile',
    action: 'updateProfile'
  })
}
```

### Backend - Servidor

```typescript
import { logError } from '~/server/utils/error'

// Captura erros manualmente no servidor
try {
  // Seu código de API
} catch (error) {
  logError(error, {
    endpoint: '/api/users',
    method: 'POST',
    userId: user.id
  })
}
```

## 📊 Ambientes

### Development
- Erros são mostrados no console
- Não enviados para o Sentry (configuração padrão)
- Útil para debug durante desenvolvimento

### Staging/Production
- Erros são enviados automaticamente
- Performance monitoring ativo
- Alertas configuráveis

## 🔍 Visualização dos Erros

Acesse seu dashboard Sentry para:
- Ver erros em tempo real
- Analisar stack traces
- Identificar usuários afetados
- Monitorar performance
- Configurar alertas

## 🛠️ Configurações Avançadas

### Filtros de Erro

O sistema automaticamente filtra:
- Erros de CORS em desenvolvimento
- Network errors comuns
- Erros de desenvolvimento

### Sampling

- **Performance**: 10% das transações (configurável)
- **Errors**: 100% dos erros capturados

### Rate Limits

Configurado para evitar excesso de logs:
- Máximo de 50 breadcrumbs por sessão
- Rate limit automático do Sentry

## 🚨 Boas Práticas

### 1. Sempre Adicione Contexto

```typescript
// ❌ Ruim
Logger.error(error)

// ✅ Bom
Logger.error(error, {
  component: 'UserProfile',
  action: 'updateEmail',
  userId: user.id
})
```

### 2. Use Tags para Classificação

```typescript
Logger.setTag('feature', 'authentication')
Logger.setTag('severity', 'high')
```

### 3. Capture Informações do Usuário

```typescript
// Quando usuário fizer login
Logger.setUser({
  id: user.id,
  email: user.email,
  role: user.role
})

// Quando fazer logout
Logger.clearUser()
```

### 4. Não Capture Dados Sensíveis

Evite capturar:
- Senhas
- Tokens de API
- Dados de cartão de crédito
- Informações pessoais sensíveis

## 🔧 Troubleshooting

### Erros Não Aparecendo

1. Verifique se `SENTRY_DSN` está configurado corretamente
2. Confirme que `SENTRY_ENVIRONMENT` está definido
3. Verifique o console do navegador por erros do Sentry
4. Teste com a página `/test-sentry`

### Performance Issues

1. Reduza o `tracesSampleRate` no `nuxt.config.ts`
2. Verifique se está filtrando erros desnecessários
3. Monitore o uso de breadcrumbs

### Dados Sensíveis

1. Revise os dados sendo enviados
2. Use `beforeSend` para filtrar informações
3. Configure scrubbing de dados sensíveis

## 📚 Links Úteis

- [Documentação Sentry](https://docs.sentry.io/)
- [Sentry para Vue.js](https://docs.sentry.io/platforms/javascript/guides/vue/)
- [Sentry para Node.js](https://docs.sentry.io/platforms/node/)
- [Dashboard Sentry](https://sentry.io)

---

**Dúvidas?** Verifique a página de teste em `/test-sentry` ou abra uma issue no repositório.