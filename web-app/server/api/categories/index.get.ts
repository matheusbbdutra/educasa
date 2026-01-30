import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  // Categorias agora são globais, não filtrar por userId
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
})
