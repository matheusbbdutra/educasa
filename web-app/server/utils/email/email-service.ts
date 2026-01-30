import { createZeptomailClient } from './zeptomail'
import type { EmailJobData } from '../../workers/types'

/**
 * Serviço unificado de email
 * 
 * Este serviço gerencia o envio de emails através do provedor configurado (Zeptomail)
 * e mantém logs de envio para auditoria.
 */

export class EmailService {
    private client: ReturnType<typeof createZeptomailClient>
    private enabled: boolean

    constructor() {
        this.client = createZeptomailClient()
        this.enabled = this.isEnabled()
    }

    /**
     * Verifica se o serviço de email está habilitado
     */
    private isEnabled(): boolean {
        const config = useRuntimeConfig()
        const enabled = config.emailWorkerEnabled || process.env.EMAIL_WORKER_ENABLED
        return enabled === 'true' && this.client !== null && this.client.isConfigured()
    }

    /**
     * Envia um email
     */
    async sendEmail(data: EmailJobData): Promise<{
        success: boolean
        messageId?: string
        error?: string
    }> {
        if (!this.enabled || !this.client) {
            console.warn('Serviço de email desabilitado ou não configurado')
            return {
                success: false,
                error: 'Email service is disabled or not configured'
            }
        }

        try {
            const result = await this.client.sendEmail({
                to: data.to,
                subject: data.subject,
                html: data.html,
                from: data.from,
                attachments: data.attachments
            })

            // Log do envio (em produção, isso deveria ir para um banco de dados)
            if (result.success) {
                console.log(`Email enviado com sucesso: ${result.messageId}`)
            } else {
                console.error(`Erro ao enviar email: ${result.error}`)
            }

            return result
        } catch (error: any) {
            console.error('Erro no serviço de email:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Verifica se o serviço está pronto para uso
     */
    isReady(): boolean {
        return this.enabled
    }

    /**
     * Retorna o status do serviço
     */
    getStatus(): {
        enabled: boolean
        configured: boolean
        ready: boolean
    } {
        return {
            enabled: this.enabled,
            configured: this.client !== null && this.client.isConfigured(),
            ready: this.isReady()
        }
    }
}

/**
 * Instância singleton do serviço de email
 */
let emailServiceInstance: EmailService | null = null

export function getEmailService(): EmailService {
    if (!emailServiceInstance) {
        emailServiceInstance = new EmailService()
    }
    return emailServiceInstance
}
