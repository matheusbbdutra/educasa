import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { getUserFromEvent } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório')
})

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createCustomError(401, 'Não autenticado')
  }

  const id = getRouterParam(event, 'id')
  const validatedBody = await readValidatedBody(event, updateSchema.parse)

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

    // Bloquear edição de subcategorias do sistema
    if (subcategory.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Não é permitido editar subcategorias pré-configuradas do sistema'
      })
    }

    // Bloquear edição de subcategorias de outros usuários
    if (subcategory.userId && subcategory.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        message: 'Você não tem permissão para editar esta subcategoria'
      })
    }

    const updated = await prisma.subcategory.update({
      where: { id },
      data: {
        name: validatedBody.name
      }
    })

    return updated
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Erro ao atualizar subcategoria'
    })
  }
})
