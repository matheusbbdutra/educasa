export default defineNuxtPlugin({
  name: 'sentry-handlers',
  parallel: true,
  setup(nuxtApp) {
    const config = useRuntimeConfig()
    
    // Só inicializa os handlers se tiver DSN configurado
    if (!config.public.sentryDsn) {
      return
    }

    // Configuração adicional de handlers para Vue
    const vueApp = nuxtApp.vueApp
    vueApp.mixin({
      errorCaptured(err: Error, instance: any, info: string) {
        console.error('Erro capturado no Vue:', err, info)
        
        // Envia para o Sentry (já inicializado no sentry-sdk.client.ts)
        if (process.client && window.Sentry) {
          window.Sentry.captureException(err, {
            contexts: {
              vue: {
                componentName: instance?.$options?.name || 'Unknown',
                lifecycle: info
              }
            },
            tags: {
              source: 'vue_error_handler'
            }
          })
        }
        
        return false // Não impede a propagação do erro
      }
    })

    // Captura erros globais não tratados
    if (process.client) {
      window.addEventListener('error', (event) => {
        console.error('Erro global capturado:', event.error)
        
        if (window.Sentry) {
          window.Sentry.captureException(event.error, {
            tags: {
              source: 'global_error_handler'
            }
          })
        }
      })

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Promise rejeitada não tratada:', event.reason)
        
        if (window.Sentry) {
          window.Sentry.captureException(event.reason, {
            tags: {
              source: 'unhandled_promise_rejection'
            }
          })
        }
      })
    }
  }
})