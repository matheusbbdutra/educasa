import { Logger } from '~/utils/logger'

export default defineNuxtPlugin(() => {
  // Configura contexto inicial
  Logger.setTag('build_time', process.env.npm_package_buildTime || new Date().toISOString())
  Logger.setTag('environment', process.env.NODE_ENV || 'development')
  
  // Adiciona contexto do navegador
  if (process.client) {
    Logger.setContext('browser', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    })
  }
  
  // Adiciona contexto do servidor
  if (process.server) {
    Logger.setContext('server', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    })
  }
  
  return {
    provide: {
      logger: Logger
    }
  }
})