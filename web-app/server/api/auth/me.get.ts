import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Não autorizado'
    })
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      turmaId: true,
      turma: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  if (!fullUser) {
    throw createError({
      statusCode: 404,
      message: 'Usuário não encontrado'
    })
  }

  return fullUser
})
