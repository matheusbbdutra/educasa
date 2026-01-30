import { H3Event } from 'h3'
import { getUser } from '../../utils/auth'

/**
 * GET /api/transactions/export
 *
 * Retorna CSV com histórico completo do aluno autenticado
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    // 1. Autenticação
    const user = await getUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Não autenticado'
      })
    }

    // 2. Construir URL do Go Worker
    const goWorkerUrl = process.env.GO_WORKER_URL || 'http://go-worker:8080'
    const apiKey = process.env.GO_WORKER_API_KEY || ''

    // 3. Proxy request para o Go Worker
    const params = new URLSearchParams()
    params.set('userId', user.id)
    // startDate e endDate opcionais

    const targetUrl = `${goWorkerUrl}/api/v1/export/csv?${params.toString()}`

    return proxyRequest(event, targetUrl, {
      headers: {
        'X-API-Key': apiKey
      }
    })

  } catch (error) {
    console.error('Erro na exportação:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao gerar arquivo de exportação'
    })
  }
})
