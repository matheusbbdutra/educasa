import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { verifyPassword, generateToken } from '~/server/utils/auth'
import { createCustomError } from '~/server/utils/error'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
})

export default defineEventHandler(async (event) => {
  try {
    const { email, password } = await readValidatedBody(event, loginSchema.parse)

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true
      }
    })

    if (!user) {
      throw createCustomError(401, 'Email ou senha incorretos')
    }

    // Verifica senha
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw createCustomError(401, 'Email ou senha incorretos')
    }

    // Gera token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  } catch (error: any) {
    // Se for erro do Prisma (banco de dados), retorna mensagem genérica
    if (error.code?.startsWith('P') || error.message?.includes('prisma') || error.message?.includes('database')) {
      throw createCustomError(500, 'Erro no servidor. Tente novamente mais tarde.')
    }
    // Propaga outros erros
    throw error
  }
})
