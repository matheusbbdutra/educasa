import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'
import { createDefaultCategories } from '~/server/utils/seed-user-categories'

const updateExternalUserSchema = z.object({
  role: z.enum(['STUDENT', 'EXTERNAL']),
  turmaId: z.string().optional().nullable()
}).refine(
  (data) => {
    // Se for converter para STUDENT, precisa de turma
    if (data.role === 'STUDENT' && !data.turmaId) {
      return false
    }
    return true
  },
  {
    message: "Alunos devem ser associados a uma turma",
    path: ["turmaId"]
  }
)

export default defineEventHandler(async (event) => {
  // Verifica se é admin
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.role !== 'ADMIN') {
    throw createCustomError(403, 'Acesso negado')
  }

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createCustomError(400, 'ID do usuário é obrigatório')
  }

  const body = await readValidatedBody(event, updateExternalUserSchema.parse)

  // Verifica se o usuário existe
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!existingUser) {
    throw createCustomError(404, 'Usuário não encontrado')
  }

  // Se for converter para STUDENT, verifica se a turma existe
  if (body.role === 'STUDENT' && body.turmaId) {
    const turma = await prisma.turma.findUnique({
      where: { id: body.turmaId }
    })

    if (!turma) {
      throw createCustomError(404, 'Turma não encontrada')
    }

    // Cria categorias padrão para o novo aluno (se ainda não tiver)
    await createDefaultCategories(userId)
  }

  // Atualiza o usuário
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: body.role,
      turmaId: body.role === 'STUDENT' ? body.turmaId : null
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      turmaId: true,
      turma: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return {
    user: updatedUser,
    message: `Usuário convertido para ${body.role === 'STUDENT' ? 'aluno' : 'participante externo'} com sucesso!`
  }
})
