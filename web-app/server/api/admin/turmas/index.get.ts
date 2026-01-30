import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Acesso negado'
    })
  }

  const turmas = await prisma.turma.findMany({
    include: {
      students: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return turmas
})
