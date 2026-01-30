import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createCustomError(401, 'Não autenticado')
  }

  const id = getRouterParam(event, 'id')

  try {
    // Verificar se a subcategoria existe
    const subcategory = await prisma.subcategory.findUnique({
      where: { id }
    })

    if (!subcategory) {
      throw createError({
        statusCode: 404,
        message: 'Subcategoria não encontrada'
      })
    }

    // Bloquear exclusão de subcategorias do sistema
    if (subcategory.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Não é permitido excluir subcategorias pré-configuradas do sistema'
      })
    }

    // Bloquear exclusão de subcategorias de outros usuários
    if (subcategory.userId && subcategory.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        message: 'Você não tem permissão para excluir esta subcategoria'
      })
    }

    // Deletar em cascata: transactions
    await prisma.subcategory.delete({
      where: { id }
    })

    return { message: 'Subcategoria removida com sucesso' }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Erro ao remover subcategoria'
    })
  }
})
