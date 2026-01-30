import { H3Event } from 'h3'
import { prisma } from '../../utils/prisma'
import { getUser } from '../../utils/auth'
import { enqueueGoWorkerJob } from '../../utils/go-worker-client'

/**
 * POST /api/transactions/export-email
 *
 * Envia histórico completo do aluno por email (via Go Worker)
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    // 1. Autenticação
    const user = await getUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Não autenticado'
      })
    }

    // 2. Verificar configuração de email
    // 2. Verificar configuração de email
    // Tentar buscar do banco primeiro, fallback para variável de ambiente
    const emailSetting = await prisma.systemSetting.findUnique({
      where: { key: 'admin_notification_email' }
    })

    const adminEmail = emailSetting?.value || process.env.EXPORT_TO_EMAIL

    if (!adminEmail) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Email administrativo não configurado (Verifique Configurações > Geral)'
      })
    }

    // 3. Buscar data da primeira transação (apenas para registro)
    const firstTransaction = await prisma.transaction.findFirst({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
      select: { date: true }
    })

    const startDate = firstTransaction?.date || new Date()

    // 4. Buscar turma
    const userWithTurma = await prisma.user.findUnique({
      where: { id: user.id },
      include: { turma: true }
    })

    // 5. Criar registro de exportação
    const exportRecord = await prisma.emailExport.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        type: 'MANUAL',
        status: 'PENDING',
        startDate: startDate,
        endDate: new Date(),
        toEmail: adminEmail,
        subject: 'Exportação de Dados Solicitada',
        recipientsCount: 1,
        batchId: 'pending'  // Será atualizado quando o Go worker retornar
      }
    })

    // 6. Enfileir job no Go Worker (assíncrono)
    const jobId = await enqueueGoWorkerJob({
      type: 'MANUAL',
      priority: 1, // Alta prioridade (solicitação do usuário)
      payload: {
        export_record_id: exportRecord.id,
        turma_name: userWithTurma?.turma?.name || 'Sem turma',
        user_ids: [user.id],
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
        to_email: adminEmail,
        subject: `Exportação de Dados - ${userWithTurma?.turma?.name || 'Sem turma'}`
      }
    })

    // 7. Atualizar registro com batchId
    await prisma.emailExport.update({
      where: { id: exportRecord.id },
      data: { batchId: jobId }
    })

    // 8. Retornar imediatamente
    return {
      success: true,
      message: 'Seu histórico completo será enviado por email em instantes',
      exportId: exportRecord.id,
      jobId
    }

  } catch (error) {
    console.error('Erro ao enfileirar exportação por email:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar solicitação de exportação'
    })
  }
})
