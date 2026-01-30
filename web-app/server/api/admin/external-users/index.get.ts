import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Verifica se é admin
    const user = await getUserFromEvent(event)
    if (!user || user.role !== 'ADMIN') {
      throw createCustomError(403, 'Acesso negado')
    }

    const externalUsers = await prisma.user.findMany({
      where: {
        role: 'EXTERNAL'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return externalUsers
  } catch (error: any) {
    // Se for erro do Prisma (banco de dados), retorna mensagem genérica
    if (error.code?.startsWith('P') || error.message?.includes('prisma') || error.message?.includes('database')) {
      throw createCustomError(500, 'Erro ao acessar banco de dados')
    }
    // Propaga outros erros
    throw error
  }
})