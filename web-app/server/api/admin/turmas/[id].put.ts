import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { createCustomError } from '~/server/utils/error'

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createCustomError(403, 'Acesso negado')
  }

  const id = getRouterParam(event, 'id')
  const validatedBody = await readValidatedBody(event, updateSchema.parse)

  try {
    const turma = await prisma.turma.update({
      where: { id },
      data: {
        name: validatedBody.name,
        description: validatedBody.description
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return turma
  } catch (error) {
    throw createCustomError(500, 'Erro ao atualizar turma')
  }
})
