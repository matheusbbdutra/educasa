import prisma from '~/server/utils/prisma'
import { getUserFromEvent } from '~/server/utils/auth'

/**
 * GET /api/user/profile
 *
 * Retorna dados do perfil do usuário autenticado
 * Inclui consentimento de exportação automática
 */
export default defineEventHandler(async (event) => {
  try {
    // 1. Autenticação
    const user = await getUserFromEvent(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Não autenticado'
      })
    }

    // 2. Buscar dados completos do usuário
    const userData = await prisma.user.findUnique({
      where: {
        id: user.userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        autoExportConsent: true,
        turma: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuário não encontrado'
      })
    }

    // 3. Retornar dados do usuário
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      autoExportConsent: userData.autoExportConsent,
      turma: userData.turma
    }

  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar perfil do usuário'
    })
  }
})
