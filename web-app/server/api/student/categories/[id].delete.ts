import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  try {
    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id }
    })

    if (!category) {
      throw createError({
        statusCode: 404,
        message: 'Categoria não encontrada'
      })
    }

    // Bloquear exclusão de categorias do sistema
    if (category.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Não é permitido excluir categorias do sistema'
      })
    }

    // Deletar em cascata: subcategories e transactions
    await prisma.category.delete({
      where: { id }
    })

    return { message: 'Categoria removida com sucesso' }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Erro ao remover categoria'
    })
  }
})
