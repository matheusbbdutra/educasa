import prisma from '~/server/utils/prisma'
import { createCustomError } from '~/server/utils/error'
export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createCustomError(403, 'Acesso negado')
  }

  const id = getRouterParam(event, 'id')
  

  try {
    // Verificar se há alunos vinculados
    const turma = await prisma.turma.findUnique({
      where: { id },
      include: {
        students: true
      }
    })

    if (!turma) {
      throw createCustomError(404, 'Turma não encontrada')
    }

    if (turma.students && turma.students.length > 0) {
      throw createCustomError(400, 'Não é possível remover turma com alunos vinculados')
    }

    await prisma.turma.delete({
      where: { id }
    })

    return { message: 'Turma removida com sucesso' }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createCustomError(500, 'Erro ao remover turma')
  }
})
