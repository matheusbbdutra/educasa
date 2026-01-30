import { H3Event } from 'h3'
import { prisma } from '../../../utils/prisma'
import { getUser } from '../../../utils/auth'

/**
 * GET /api/admin/export/status
 *
 * Retorna status das exportações
 * Query params:
 *   - userId: filtrar por usuário específico
 *   - type: tipo de exportação (MANUAL, MONTHLY_AUTO)
 *   - status: status (PENDING, PROCESSING, SENT, FAILED)
 *   - limit: número máximo de registros (padrão: 50)
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const user = await getUser(event)
    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado'
      })
    }

    const query = getQuery(event)
    const userId = query.userId as string | undefined
    const type = query.type as string | undefined
    const status = query.status as string | undefined
    const limit = Number(query.limit || '50')

    const where: any = {}

    if (userId) where.userId = userId
    if (type) where.type = type
    if (status) where.status = status

    const exports = await prisma.emailExport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            turma: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Estatísticas
    const stats = await prisma.emailExport.groupBy({
      by: ['status', 'type'],
      _count: true
    })

    return {
      exports,
      stats
    }

  } catch (error) {
    console.error('Erro ao buscar status:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar status de exportações'
    })
  }
})
