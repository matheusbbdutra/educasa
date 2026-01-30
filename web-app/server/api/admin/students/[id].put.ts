import prisma from '~/server/utils/prisma'
import { z } from 'zod'
import { hashPassword } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

const updateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  turmaId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (user.role !== 'ADMIN') {
    throw createCustomError(403, 'Acesso negado')
  }

  const id = getRouterParam(event, 'id')
  const validatedBody = await readValidatedBody(event, updateSchema.parse)

  try {
    // Verificar se email já existe em outro usuário
    if (validatedBody.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedBody.email,
          id: { not: id }
        }
      })

      if (existingUser) {
        throw createCustomError(400, 'Email já cadastrado')
      }
    }

    const updateData: any = {
      name: validatedBody.name,
      email: validatedBody.email,
      turmaId: validatedBody.turmaId || null
    }

    // Só atualiza senha se foi fornecida
    if (validatedBody.password) {
      updateData.password = await hashPassword(validatedBody.password)
    }

    const student = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        turma: true
      }
    })

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      turmaId: student.turmaId,
      turma: student.turma
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createCustomError(500, 'Erro ao atualizar aluno')
  }
})
