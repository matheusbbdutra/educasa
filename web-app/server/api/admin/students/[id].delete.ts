import prisma from '~/server/utils/prisma'
import { createCustomError } from '~/server/utils/error'
export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createCustomError(403, 'Acesso negado')
  }

  const id = getRouterParam(event, 'id')
  

  try {
    const student = await prisma.user.findUnique({
      where: { id }
    })

    if (!student) {
      throw createCustomError(404, 'Aluno não encontrado')
    }

    if (student.role !== 'STUDENT') {
      throw createCustomError(400, 'Apenas alunos podem ser removidos por esta rota')
    }

    // Prisma vai deletar em cascata: categories, subcategories, transactions
    await prisma.user.delete({
      where: { id }
    })

    return { message: 'Aluno removido com sucesso' }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createCustomError(500, 'Erro ao remover aluno')
  }
})
