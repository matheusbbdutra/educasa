import prisma from '~/server/utils/prisma'
export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')


  try {
    // Verificar se a transação pertence ao usuário
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      throw createError({
        statusCode: 404,
        message: 'Transação não encontrada'
      })
    }

    if (transaction.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        message: 'Acesso negado'
      })
    }

    await prisma.transaction.delete({
      where: { id }
    })

    return { message: 'Transação removida com sucesso' }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Erro ao remover transação'
    })
  }
})
