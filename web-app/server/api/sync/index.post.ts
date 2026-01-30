import { createClient } from '@libsql/client'
import { getTursoConfig } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  // Verificar se é admin (opcional - ajustar conforme necessário)
  // Para produção, adicionar verificação de autenticação

  const config = getTursoConfig()

  // Se não estiver usando embedded replica, retornar erro
  if (!config.syncUrl) {
    throw createError({
      statusCode: 501,
      message: 'Sync not available - embedded replica is not enabled'
    })
  }

  try {
    const client = createClient({
      url: config.url,
      syncUrl: config.syncUrl,
      authToken: config.authToken
    })

    await client.sync()

    return {
      status: 'synced',
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Sync failed'
    })
  }
})
