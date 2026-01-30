import { H3Event } from 'h3'
import { prisma } from '../../utils/prisma'
import { getUser } from '../../utils/auth'

/**
 * PUT /api/user/export-consent
 *
 * Atualiza o consentimento de exportação automática do usuário
 * Body: { consent: boolean }
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    const user = await getUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Não autenticado'
      })
    }

    const body = await readBody(event)
    const consent = body?.consent

    if (typeof consent !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Consentimento deve ser um booleano'
      })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { autoExportConsent: consent }
    })

    return {
      success: true,
      message: consent
        ? 'Exportação automática ativada'
        : 'Exportação automática desativada'
    }

  } catch (error) {
    console.error('Erro ao salvar consentimento:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao salvar consentimento'
    })
  }
})
