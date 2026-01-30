import { prisma } from '../../utils/prisma'
import { getUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    // 1. Verify Authentication & Authorization (Admin only)
    const user = await getUser(event)
    if (!user || user.role !== 'ADMIN') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Acesso negado'
        })
    }

    const method = event.method

    // GET: Fetch all settings (currently only admin_notification_email)
    if (method === 'GET') {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'admin_notification_email' }
        })

        return {
            admin_notification_email: setting?.value || process.env.EXPORT_TO_EMAIL || ''
        }
    }

    // POST: Update settings
    if (method === 'POST') {
        const body = await readBody(event)
        const { admin_notification_email } = body

        if (admin_notification_email) {
            await prisma.systemSetting.upsert({
                where: { key: 'admin_notification_email' },
                update: {
                    value: admin_notification_email,
                    updatedAt: new Date()
                },
                create: {
                    key: 'admin_notification_email',
                    value: admin_notification_email,
                    description: 'Email para recebimento de relatórios e notificações administrativas',
                    group: 'general'
                }
            })
        }

        return { success: true }
    }
})
