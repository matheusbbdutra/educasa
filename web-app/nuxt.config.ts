// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: true,

  routeRules: {
    '/admin/**': { render: 'client' },
    '/dashboard/**': { render: 'client' },
    '/transactions/**': { render: 'client' },
    '/categories/**': { render: 'client' },
    '/settings/**': { render: 'client' }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],

  runtimeConfig: {
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || '',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    // JWT
    jwtSecret: process.env.JWT_SECRET || '',
    // Sentry
    sentryDsn: process.env.SENTRY_DSN || '',
    sentryDebug: process.env.SENTRY_DEBUG === 'true',
    sentryLogLevel: process.env.SENTRY_LOG_LEVEL || 'error',
    // Exportação
    exportToEmail: process.env.EXPORT_TO_EMAIL || '',
    exportBatchSize: Number(process.env.EXPORT_BATCH_SIZE || '20'),
    // Cron
    cronEnabled: process.env.CRON_ENABLED === 'true',
    cronSecret: process.env.CRON_SECRET || '',
    public: {
      appName: 'Educa.SA - Educação Financeira na Sala de Ações',
      sentryDsn: process.env.SENTRY_DSN || ''
    }
  },

  nitro: {
    preset: 'node-server',
    experimental: {
      wasm: true
    }
  },

  app: {
    head: {
      title: 'Educa.SA - Educação Financeira',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Educa.SA - Educação Financeira na Sala de Ações - Sistema educacional de gestão financeira pessoal' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
        { rel: 'icon', type: 'image/png', href: '/logosa.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css', '~/assets/css/responsive.css']
})
