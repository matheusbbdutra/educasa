import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { createCustomError } from '~/server/utils/error'

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido')
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const { name, email } = await readValidatedBody(event, updateSchema.parse)

  try {
    // Verificar se email já existe em outro usuário
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: user.userId }
      }
    })

    if (existingUser) {
      throw createCustomError(400, 'Email já cadastrado')
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        name,
        email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return updated
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createCustomError(500, 'Erro ao atualizar perfil')
  }
})
