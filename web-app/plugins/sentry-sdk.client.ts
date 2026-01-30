import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin({
  name: 'sentry-sdk',
  parallel: true,
  setup(nuxtApp) {
    const config = useRuntimeConfig()
    
    // Só inicializa o Sentry se tiver DSN configurado
    if (!config.public.sentryDsn) {
      console.warn('Sentry DSN não configurado. Monitoramento de erros desativado.')
      return
    }

    // Inicializa o SDK do Sentry
    Sentry.init({
      app: nuxtApp.vueApp,
      dsn: config.public.sentryDsn,
      environment: process.env.NODE_ENV || 'production',
      
      // Configurações de performance (desativado em desenvolvimento)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0, // 10% das transações apenas em produção
      
      // Configurações de erro
      maxBreadcrumbs: 50,
      debug: config.sentryDebug, // Controlado por variável de ambiente
      
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

    // Disponibiliza o Sentry globalmente
    if (process.client) {
      window.Sentry = Sentry
    }

    if (config.sentryDebug) {
      console.log('✅ Sentry SDK inicializado no cliente')
    }
  }
})