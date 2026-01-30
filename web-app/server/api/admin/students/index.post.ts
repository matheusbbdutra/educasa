import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { hashPassword } from '~/server/utils/auth'

const createStudentSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  turmaId: z.string().optional()
})

import { createDefaultCategories } from '~/server/utils/seed-user-categories'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  // Apenas admin pode criar alunos
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Acesso negado'
    })
  }

  const { email, name, password, turmaId } = await readValidatedBody(event, createStudentSchema.parse)

  // Verifica se email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: 'Email já cadastrado'
    })
  }

  // Cria o aluno
  const hashedPassword = await hashPassword(password)

  const student = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'STUDENT',
      turmaId
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      turmaId: true,
      turma: {
        select: {
          id: true,
          name: true
        }
      },
      createdAt: true
    }
  })

  // Cria categorias padrão para o aluno usando o utilitário
  await createDefaultCategories(student.id)

  return student
})
