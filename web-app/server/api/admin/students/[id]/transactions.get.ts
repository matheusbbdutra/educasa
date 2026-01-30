import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const studentId = event.context.params?.id

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Student ID is required',
    })
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: studentId,
        type: 'EXPENSE',
      },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return transactions
  } catch (error) {
    console.error('Error fetching student transactions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch student transactions',
    })
  }
})
