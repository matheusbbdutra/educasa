// Helper para verificar se o Sentry está disponível
const isSentryAvailable = () => {
  return typeof window !== 'undefined' && 
         typeof (window as any).Sentry !== 'undefined'
}

// Helper para verificar se debug está ativo
const isDebugEnabled = () => {
  return typeof window !== 'undefined' && 
         (window as any).__NUXT__?.runtimeConfig?.public?.sentryDebug === true
}

export class Logger {
  static info(message: string, context?: Record<string, any>) {
    console.log(`[INFO] ${message}`, context)
    
    // Envia breadcrumb para o Sentry se disponível e não for debug
    if (isSentryAvailable() && !isDebugEnabled()) {
      try {
        (window as any).Sentry.addBreadcrumb({
          message,
          level: 'info',
          data: context
        })
      } catch (err) {
        if (!isDebugEnabled()) {
          console.warn('Erro ao enviar breadcrumb para Sentry:', err)
        }
      }
    }
  }

  static warn(message: string, context?: Record<string, any>) {
    console.warn(`[WARN] ${message}`, context)
    
    // Envia breadcrumb para o Sentry se disponível e não for debug
    if (isSentryAvailable() && !isDebugEnabled()) {
      try {
        (window as any).Sentry.addBreadcrumb({
          message,
          level: 'warning',
          data: context
        })
      } catch (err) {
        if (!isDebugEnabled()) {
          console.warn('Erro ao enviar breadcrumb para Sentry:', err)
        }
      }
    }
  }

  static error(error: Error | string, context?: Record<string, any>) {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    
    console.error(`[ERROR] ${errorObj.message}`, context)
    
    // Envia para o Sentry se disponível
    if (isSentryAvailable()) {
      try {
        (window as any).Sentry.captureException(errorObj, {
          contexts: {
            frontend: context || {}
          },
          tags: {
            source: 'frontend_logger'
          }
        })
      } catch (err) {
        console.warn('Erro ao enviar exceção para Sentry:', err)
      }
    }
  }

  static apiError(error: any, endpoint: string, method: string) {
    const message = `API Error: ${method} ${endpoint}`
    const errorContext = {
      endpoint,
      method,
      statusCode: error.response?.status,
      statusText: error.response?.statusText,
      data: error.data
    }

    console.error(message, errorContext)
    
    // Envia para o Sentry com contexto específico de API se disponível
    if (isSentryAvailable()) {
      try {
        (window as any).Sentry.captureException(error, {
          contexts: {
            api: errorContext
          },
          tags: {
            source: 'frontend_api_error',
            endpoint,
            method,
            statusCode: error.response?.status?.toString() || 'unknown'
          }
        })
      } catch (err) {
        console.warn('Erro ao enviar erro de API para Sentry:', err)
      }
    }
  }

  static setUser(user: any) {
    if (isSentryAvailable() && user) {
      try {
        (window as any).Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.name,
          role: user.role
        })
      } catch (err) {
        console.warn('Erro ao definir usuário no Sentry:', err)
      }
    }
  }

  static clearUser() {
    if (isSentryAvailable()) {
      try {
        (window as any).Sentry.setUser(null)
      } catch (err) {
        console.warn('Erro ao limpar usuário no Sentry:', err)
      }
    }
  }

  static setTag(key: string, value: string) {
    if (isSentryAvailable()) {
      try {
        (window as any).Sentry.setTag(key, value)
      } catch (err) {
        console.warn('Erro ao definir tag no Sentry:', err)
      }
    }
  }

  static setContext(key: string, context: Record<string, any>) {
    if (isSentryAvailable()) {
      try {
        (window as any).Sentry.setContext(key, context)
      } catch (err) {
        console.warn('Erro ao definir contexto no Sentry:', err)
      }
    }
  }
}