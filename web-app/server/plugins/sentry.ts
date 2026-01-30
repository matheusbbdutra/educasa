export default defineNitroPlugin((nitroApp) => {
  // No servidor Nitro, usar process.env diretamente para ler em runtime
  // runtimeConfig é avaliado no build, process.env é lido em execução
  const sentryDsn = process.env.SENTRY_DSN || ''
  const sentryDebug = process.env.SENTRY_DEBUG === 'true'
  const sentryLogLevel = process.env.SENTRY_LOG_LEVEL || 'error'

  // Configura nível de log do OpenTelemetry baseado na configuração
  const logLevel = sentryLogLevel === 'none' ? 'NONE' : 'ERROR'
  process.env.OTEL_LOG_LEVEL = logLevel

  // Silencia completamente se não for debug
  if (!sentryDebug && sentryLogLevel === 'none') {
    process.env.SENTRY_LOGS = '0'
  }

  // Só inicializa se tiver DSN configurado
  if (!sentryDsn) {
    console.warn('Sentry DSN não configurado. Monitoramento de erros desativado no servidor.')
    return
  }

  // Importa o Sentry apenas no servidor
  import('@sentry/node').then(Sentry => {
    // Inicializa o Sentry no servidor
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'production',

      // Configurações de performance (desativado em desenvolvimento)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0, // 10% das transações apenas em produção

      // Configurações de erro
      maxBreadcrumbs: 50,
      debug: sentryDebug, // Controlado por variável de ambiente
      
      // Filtros para não enviar erros de desenvolvimento
      beforeSend(event) {
        // Em desenvolvimento, mostra no console mas não envia
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry Event:', event)
          return null
        }
        
        // Filtra erros de CORS e outros erros comuns de desenvolvimento
        if (event.exception?.values?.[0]?.value?.includes('Network Error')) {
          return null
        }
        
        return event
      }
    })

    // Hook para capturar erros de API
    nitroApp.hooks.hook('request', (event) => {
      const start = Date.now()
      
      // Adiciona contexto da requisição
      event.context.sentry = {
        request: {
          method: event.node.req.method,
          url: event.node.req.url,
          headers: event.node.req.headers,
          userAgent: event.node.req.headers['user-agent']
        }
      }
      
      // Hook de resposta para medir performance
      event.node.res.on('finish', () => {
        const duration = Date.now() - start
        
        // Envia transação de performance
        Sentry.addBreadcrumb({
          message: `${event.node.req.method} ${event.node.req.url}`,
          category: 'http',
          level: event.node.res.statusCode >= 400 ? 'error' : 'info',
          data: {
            statusCode: event.node.res.statusCode,
            duration: duration
          }
        })
      })
    })

    // Hook para capturar erros não tratados
    nitroApp.hooks.hook('error', (error, event) => {
      console.error('Erro no Nitro:', error)
      
      Sentry.captureException(error, {
        contexts: {
          request: event?.context?.sentry?.request || {},
          nitro: {
            event: 'nitro_error'
          }
        },
        tags: {
          source: 'nitro_error_handler'
        }
      })
    })

    if (sentryDebug) {
      console.log('✅ Sentry inicializado no servidor')
    }
  }).catch(error => {
    console.error('❌ Erro ao inicializar Sentry no servidor:', error)
  })
})