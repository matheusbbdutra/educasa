import type { ZeptomailConfig } from '../workers/types'

/**
 * Cliente Zeptomail para envio de emails
 * 
 * Documentação: https://www.zoho.com/zeptomail/help/api/
 */

const ZEPTOMAIL_API_URL = 'https://api.zeptomail.com/v1.1/email'

export class ZeptomailClient {
    private apiKey: string
    private fromEmail: string
    private fromName: string

    constructor(config: ZeptomailConfig) {
        this.apiKey = config.apiKey
        this.fromEmail = config.fromEmail
        this.fromName = config.fromName
    }

    /**
     * Envia um email usando a API do Zeptomail
     */
    async sendEmail(params: {
        to: string | string[]
        subject: string
        html: string
        from?: { email: string; name: string }
        attachments?: Array<{ filename: string; content: string; encoding?: string }>
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const recipients = Array.isArray(params.to)
                ? params.to.map(email => ({ email_address: { address: email } }))
                : [{ email_address: { address: params.to } }]

            const from = params.from || {
                email: this.fromEmail,
                name: this.fromName
            }

            const body: any = {
                from: {
                    address: from.email,
                    name: from.name
                },
                to: recipients,
                subject: params.subject,
                htmlbody: params.html
            }

            // Adicionar anexos se fornecidos
            if (params.attachments && params.attachments.length > 0) {
                body.attachments = params.attachments.map(att => ({
                    name: att.filename,
                    content: att.content,
                    encoding: att.encoding || 'base64'
                }))
            }

            const response = await fetch(ZEPTOMAIL_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(`Zeptomail API error: ${response.status} - ${JSON.stringify(errorData)}`)
            }

            const data = await response.json()
            return {
                success: true,
                messageId: data.message_id || data.data?.[0]?.message_id
            }
        } catch (error: any) {
            console.error('Erro ao enviar email via Zeptomail:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Verifica se o cliente está configurado corretamente
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.fromEmail && this.fromName)
    }
}

/**
 * Cria uma instância do cliente Zeptomail a partir das variáveis de ambiente
 */
export function createZeptomailClient(): ZeptomailClient | null {
    const config = useRuntimeConfig()

    const apiKey = config.zeptomailApiKey || process.env.ZEPTOMAIL_API_KEY
    const fromEmail = config.zeptomailFromEmail || process.env.ZEPTOMAIL_FROM_EMAIL
    const fromName = config.zeptomailFromName || process.env.ZEPTOMAIL_FROM_NAME

    if (!apiKey || !fromEmail || !fromName) {
        console.warn('Zeptomail não configurado. Defina ZEPTOMAIL_API_KEY, ZEPTOMAIL_FROM_EMAIL e ZEPTOMAIL_FROM_NAME')
        return null
    }

    return new ZeptomailClient({
        apiKey,
        fromEmail,
        fromName
    })
}
