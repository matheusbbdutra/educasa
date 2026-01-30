import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { createCustomError } from '~/server/utils/error'
import { getUserFromEvent } from '~/server/utils/auth'

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  categoryId: z.string().min(1, 'Categoria é obrigatória')
})

export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createCustomError(401, 'Não autenticado')
  }

  const validatedBody = await readValidatedBody(event, createSchema.parse)

  try {
    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: validatedBody.categoryId }
    })

    if (!category) {
      throw createCustomError(404, 'Categoria não encontrada')
    }

    // Criar subcategoria personalizada (não do sistema) com userId
    const subcategory = await prisma.subcategory.create({
      data: {
        name: validatedBody.name,
        categoryId: validatedBody.categoryId,
        userId: user.userId,  // Definir userId automaticamente
        isSystem: false
      }
    })

    return subcategory
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Erro ao criar subcategoria'
    })
  }
})
