import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createCustomError(401, 'Não autenticado')
  }
  const query = getQuery(event)

  const { month, year } = query

  const where: any = {
    userId: user.userId,
    type: 'EXPENSE'
  }

  // Filtro por mês/ano se fornecido
  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)

    where.date = {
      gte: startDate,
      lte: endDate
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: true,
      subcategory: {
        include: {
          category: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  return transactions
})
