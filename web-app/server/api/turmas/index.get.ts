import prisma from '~/server/utils/prisma'
import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const turmas = await prisma.turma.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return turmas
  } catch (error: any) {
    // Se for erro do Prisma (banco de dados), retorna mensagem genérica
    if (error.code?.startsWith('P') || error.message?.includes('prisma') || error.message?.includes('database')) {
      throw createCustomError(500, 'Erro ao acessar banco de dados')
    }
    // Propaga outros erros
    throw error
  }
})