import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  // Apenas admin pode listar alunos
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Acesso negado'
    })
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      email: true,
      name: true,
      turmaId: true,
      turma: {
        select: {
          id: true,
          name: true
        }
      },
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return students
})
