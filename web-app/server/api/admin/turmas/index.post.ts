import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const createTurmaSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Acesso negado'
    })
  }

  const validatedBody = await readValidatedBody(event, createTurmaSchema.parse)

  const turma = await prisma.turma.create({
    data: validatedBody,
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
})
