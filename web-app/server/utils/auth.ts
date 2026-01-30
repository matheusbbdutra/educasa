import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { prisma } from './prisma'

export interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'STUDENT' | 'EXTERNAL'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  const config = useRuntimeConfig()
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const config = useRuntimeConfig()
    return jwt.verify(token, config.jwtSecret) as JWTPayload
  } catch {
    return null
  }
}

export async function getUserFromEvent(event: H3Event): Promise<JWTPayload | null> {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

/**
 * Retorna o usuário completo do banco a partir do evento
 * Equivalente ao serverSuppliedUser do nuxt-auth-utils
 */
export async function getUser(event: H3Event) {
  const payload = await getUserFromEvent(event)
  if (!payload) {
    return null
  }

  return prisma.user.findUnique({
    where: { id: payload.userId }
  })
}
