import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

interface TursoConfig {
  url: string           // "file:./webapp.db" ou "libsql://..."
  syncUrl?: string      // "libsql://..." para embedded replica
  authToken: string
  syncInterval?: number // Segundos
}

const getTursoConfig = (): TursoConfig => {
  const isEmbedded = process.env.USE_EMBEDDED_REPLICA === 'true'
  const remoteUrl = process.env.TURSO_DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || ''

  if (isEmbedded) {
    return {
      url: process.env.EMBEDDED_DB_PATH || 'file:./database/webapp.db',
      syncUrl: remoteUrl,
      authToken,
      syncInterval: parseInt(process.env.SYNC_INTERVAL || '60', 10)
    }
  }

  // Modo produção direto ao cloud (sem embedded replica)
  return {
    url: remoteUrl,
    authToken
  }
}

const createPrismaClient = (): PrismaClient => {
  const config = getTursoConfig()

  const adapter = new PrismaLibSql({
    url: config.url,
    authToken: config.authToken,
    ...(config.syncUrl && { syncUrl: config.syncUrl }),
    ...(config.syncInterval && { syncInterval: config.syncInterval })
  })

  return new PrismaClient({ adapter })
}

// Singleton pattern para hot-reload em dev
declare global {
  var __prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient()
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient()
  }
  prisma = global.__prisma
}

export default prisma
export { prisma }
export { getTursoConfig }
