import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Retornar todas as categorias globais do sistema
    const categories = await prisma.category.findMany({
      where: {
        type: 'EXPENSE'
      },
      include: {
        subcategories: {
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return categories
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao buscar categorias'
    })
  }
})
