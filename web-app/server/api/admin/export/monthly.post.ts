import { H3Event } from 'h3'
import { prisma } from '../../../utils/prisma'
import { getUser } from '../../../utils/auth'
import { enqueueGoWorkerJob } from '../../../utils/go-worker-client'

/**
 * POST /api/admin/export/monthly
 *
 * Exporta dados de todos os alunos que consentiram
 * Enfileira jobs no Go Worker para processamento assíncrono
 */
export default defineEventHandler(async (event: H3Event) => {
  try {
    // 1. Verificar autenticação ADMIN
    const user = await getUser(event)
    if (!user || user.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado'
      })
    }

    // 2. Verificar chave de segurança (para evitar chamadas não autorizadas)
    const body = await readBody(event)
    const cronKey = body?.cronKey || getHeader(event, 'x-cron-key')

    if (cronKey !== process.env.CRON_SECRET) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Chave de cron inválida'
      })
    }

    // 3. Buscar alunos que consentiram
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        autoExportConsent: true
      },
      include: {
        turma: true
      }
    })

    if (students.length === 0) {
      return {
        success: true,
        message: 'Nenhum aluno com consentimento encontrado',
        processed: 0
      }
    }

    // OBS: O Go worker buscará as transações diretamente do banco
    // Não precisamos mais buscar aqui

    // 5. Calcular período do mês anterior
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // 6. Agrupar por turma (para organizar os emails)
    const byTurma = new Map<string, typeof students>()
    for (const student of students) {
      const turmaName = student.turma?.name || 'Sem Turma'
      if (!byTurma.has(turmaName)) {
        byTurma.set(turmaName, [])
      }
      byTurma.get(turmaName)!.push(student)
    }

    const adminEmail = process.env.EXPORT_TO_EMAIL
    if (!adminEmail) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Email administrativo não configurado'
      })
    }

    // 7. Enfileirar jobs no Go Worker para cada turma
    let totalProcessed = 0
    const jobIds: string[] = []

    for (const [turmaName, turmaStudents] of byTurma.entries()) {
      try {
        // Enfileirar job no Go Worker
        const jobId = await enqueueGoWorkerJob({
          type: 'MONTHLY_AUTO',
          priority: 1,
          payload: {
            turma_name: turmaName,
            user_ids: turmaStudents.map(s => s.id),
            start_date: lastMonth.toISOString(),
            end_date: endOfLastMonth.toISOString(),
            to_email: adminEmail
          }
        })

        jobIds.push(jobId)

        // Criar registros de exportação para rastreamento
        await Promise.all(
          turmaStudents.map(student =>
            prisma.emailExport.create({
              data: {
                userId: student.id,
                userEmail: student.email,
                userName: student.name,
                type: 'MONTHLY_AUTO',
                status: 'PENDING',
                startDate: lastMonth,
                endDate: endOfLastMonth,
                toEmail: adminEmail,
                subject: `Relatório Mensal - ${turmaName}`,
                recipientsCount: turmaStudents.length,
                batchId: jobId
              }
            })
          )
        )

        totalProcessed += turmaStudents.length
      } catch (error) {
        console.error(`Erro ao enfileirar job para turma ${turmaName}:`, error)
        throw error
      }
    }

    // 8. Retornar resumo
    const estimatedTime = Math.ceil(students.length / 20) * 2 // 2 min por batch de 20
    return {
      success: true,
      message: `Exportação enfileirada com sucesso`,
      jobs_enqueued: jobIds.length,
      job_ids: jobIds,
      processed: totalProcessed,
      estimated_time_minutes: estimatedTime
    }

  } catch (error) {
    console.error('Erro na exportação mensal:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar exportação mensal'
    })
  }
})
