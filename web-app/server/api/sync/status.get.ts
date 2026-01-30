import { getTursoConfig } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const config = getTursoConfig()

  const isEmbedded = !!config.syncUrl

  return {
    enabled: isEmbedded,
    mode: isEmbedded ? 'embedded' : 'cloud',
    url: config.url,
    syncUrl: config.syncUrl || null,
    syncInterval: config.syncInterval || null,
    timestamp: new Date().toISOString()
  }
})
