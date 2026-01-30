import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { hashPassword } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)

  // Verifica se email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (existingUser) {
    throw createCustomError(400, 'Email já cadastrado')
  }

  // Hash da senha
  const hashedPassword = await hashPassword(body.password)

  // Cria usuário como EXTERNAL (administrador pode converter para STUDENT depois)
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: 'EXTERNAL',
      turmaId: null
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
      }
    }
  })

  return {
    user,
    message: 'Usuário criado com sucesso!'
  }
})