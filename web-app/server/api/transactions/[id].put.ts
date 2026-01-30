import prisma from '~/server/utils/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string(),
  subcategoryId: z.string().min(1, 'Subcategoria é obrigatória')
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')
  const validatedBody = await readValidatedBody(event, updateSchema.parse)

  try {
    // Verificar se a transação pertence ao usuário
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    })

    if (!existingTransaction) {
      throw createError({
        statusCode: 404,
        message: 'Transação não encontrada'
      })
    }

    if (existingTransaction.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        message: 'Acesso negado'
      })
    }

    // Buscar a subcategoria para pegar o categoryId
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: validatedBody.subcategoryId },
      include: { category: true }
    })

    if (!subcategory) {
      throw createError({
        statusCode: 404,
        message: 'Subcategoria não encontrada'
      })
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: validatedBody.description,
        amount: validatedBody.amount,
        date: new Date(validatedBody.date),
        categoryId: subcategory.categoryId,
        subcategoryId: validatedBody.subcategoryId,
        type: 'EXPENSE'
      },
      include: {
        category: true,
        subcategory: {
          include: {
            category: true
          }
        }
      }
    })

    return transaction
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Erro ao atualizar transação'
    })
  }
})
