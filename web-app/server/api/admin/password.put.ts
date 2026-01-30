import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { verifyPassword, hashPassword } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

const updateSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres')
})

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createCustomError(403, 'Acesso negado')
  }

  const { currentPassword, newPassword } = await readValidatedBody(event, updateSchema.parse)

  try {
    // Buscar usuário com senha
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      throw createCustomError(404, 'Usuário não encontrado')
    }

    // Verificar senha atual
    const isValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isValid) {
      throw createCustomError(400, 'Senha atual incorreta')
    }

    // Atualizar senha
    const newHashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword
      }
    })

    return { message: 'Senha alterada com sucesso' }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createCustomError(500, 'Erro ao alterar senha')
  }
})
