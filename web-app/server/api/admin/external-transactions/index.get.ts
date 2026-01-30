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

    const query = getQuery(event)
    const userId = query.userId as string
    const type = query.type as string
    const period = query.period as string

    // Calcula filtro de data
    let dateFilter = {}
    if (period && period !== 'all') {
      const days = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      dateFilter = {
        date: {
          gte: startDate
        }
      }
    }

    // Constrói filtro
    const where: any = {
      user: {
        role: 'EXTERNAL'
      },
      ...dateFilter
    }

    if (userId) {
      where.userId = userId
    }

    if (type) {
      where.type = type
    }

    // Busca transações
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Calcula estatísticas
    const stats = await prisma.transaction.aggregate({
      where,
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    })

    // Estatísticas separadas por tipo
    const incomeStats = await prisma.transaction.aggregate({
      where: {
        ...where,
        type: 'INCOME'
      },
      _sum: {
        amount: true
      }
    })

    const expenseStats = await prisma.transaction.aggregate({
      where: {
        ...where,
        type: 'EXPENSE'
      },
      _sum: {
        amount: true
      }
    })

    // Conta usuários externos únicos
    const uniqueUsers = await prisma.user.count({
      where: {
        role: 'EXTERNAL',
        transactions: {
          some: where
        }
      }
    })

    return {
      transactions,
      stats: {
        totalUsers: uniqueUsers,
        totalIncome: Number(incomeStats._sum.amount || 0),
        totalExpense: Number(expenseStats._sum.amount || 0),
        balance: Number(incomeStats._sum.amount || 0) - Number(expenseStats._sum.amount || 0),
        totalTransactions: stats._count.id,
        totalAmount: Number(stats._sum.amount || 0)
      }
    }
  } catch (error: any) {
    // Se for erro do Prisma (banco de dados), retorna mensagem genérica
    if (error.code?.startsWith('P') || error.message?.includes('prisma') || error.message?.includes('database')) {
      throw createCustomError(500, 'Erro ao acessar banco de dados')
    }
    // Propaga outros erros
    throw error
  }
})