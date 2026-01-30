import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const createTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().datetime(),
  subcategoryId: z.string().min(1, 'Subcategoria é obrigatória')
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const validatedBody = await readValidatedBody(event, createTransactionSchema.parse)

  try {
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

    const transaction = await prisma.transaction.create({
      data: {
        description: validatedBody.description,
        amount: validatedBody.amount,
        date: new Date(validatedBody.date),
        categoryId: subcategory.categoryId,
        subcategoryId: validatedBody.subcategoryId,
        type: 'EXPENSE',
        userId: user.userId
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
      message: 'Erro ao criar transação'
    })
  }
})
