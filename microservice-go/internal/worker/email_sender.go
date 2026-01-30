package worker

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strings"
	"time"

	"educasa/internal/models"
)

// SMTPClient é um cliente SMTP para envio de emails
type SMTPClient struct {
	Host     string
	Port     int
	Username string
	Password string
	FromEmail string
	FromName  string
}

// EmailAttachment representa um anexo de email
type EmailAttachment struct {
	Filename string
	Content  []string // linhas do CSV
}

// EmailRequest representa uma requisição de envio de email
type EmailRequest struct {
	To          string
	Subject     string
	HTML        string
	Attachments []EmailAttachment
}

// BatchResult representa o resultado do envio de um batch
type BatchResult struct {
	Success         bool
	BatchNumber     int
	RecipientsCount int
	EmailSent       bool
	Errors          []string
}

// BatchInfo contém informações sobre o batch
type BatchInfo struct {
	BatchNumber  int
	TotalBatches int
	BatchID      string
}

// NewSMTPClient cria um novo cliente SMTP
func NewSMTPClient(host string, port int, username, password, fromEmail, fromName string) *SMTPClient {
	return &SMTPClient{
		Host:      host,
		Port:      port,
		Username:  username,
		Password:  password,
		FromEmail: fromEmail,
		FromName:  fromName,
	}
}

// SendEmail envia um email via SMTP
func (s *SMTPClient) SendEmail(req EmailRequest) (messageID string, err error) {
	// Criar mensagem MIME
	messageID = fmt.Sprintf("<%d@educasa.app.br>", time.Now().UnixNano())

	var msg strings.Builder

	// Headers
	msg.WriteString(fmt.Sprintf("Message-ID: %s\r\n", messageID))
	msg.WriteString(fmt.Sprintf("From: %s <%s>\r\n", s.FromName, s.FromEmail))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", req.To))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", req.Subject))
	msg.WriteString("MIME-Version: 1.0\r\n")

	// Boundary para multipart
	boundary := fmt.Sprintf("boundary_%d", time.Now().UnixNano())

	if len(req.Attachments) > 0 {
		msg.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=\"%s\"\r\n", boundary))
		msg.WriteString("\r\n")

		// Parte HTML
		msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(req.HTML)
		msg.WriteString("\r\n")

		// Anexos
		for _, att := range req.Attachments {
			msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
			msg.WriteString("Content-Type: text/csv; charset=\"UTF-8\"\r\n")
			msg.WriteString(fmt.Sprintf("Content-Disposition: attachment; filename=\"%s\"\r\n", att.Filename))
			msg.WriteString("\r\n")

			// Conteúdo do CSV
			csvContent := strings.Join(att.Content, "\n")
			msg.WriteString(csvContent)
			msg.WriteString("\r\n")
		}

		msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else {
		msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(req.HTML)
	}

	// Conectar ao servidor SMTP
	addr := fmt.Sprintf("%s:%d", s.Host, s.Port)

	// Conexão simples (sem TLS inicial)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return "", fmt.Errorf("erro ao conectar: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.Host)
	if err != nil {
		return "", fmt.Errorf("erro ao criar cliente SMTP: %w", err)
	}
	defer client.Close()

	// Configurar TLS para STARTTLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         s.Host,
	}

	// Iniciar TLS (STARTTLS para porta 587)
	if err := client.StartTLS(tlsConfig); err != nil {
		return "", fmt.Errorf("erro ao iniciar TLS: %w", err)
	}

	// Autenticação
	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)
	if err := client.Auth(auth); err != nil {
		return "", fmt.Errorf("erro na autenticação SMTP: %w", err)
	}

	// Configurar remetente
	if err := client.Mail(s.FromEmail); err != nil {
		return "", fmt.Errorf("erro ao definir remetente: %w", err)
	}

	// Configurar destinatário
	if err := client.Rcpt(req.To); err != nil {
		return "", fmt.Errorf("erro ao definir destinatário: %w", err)
	}

	// Enviar corpo do email
	writer, err := client.Data()
	if err != nil {
		return "", fmt.Errorf("erro ao preparar envio: %w", err)
	}

	_, err = writer.Write([]byte(msg.String()))
	if err != nil {
		return "", fmt.Errorf("erro ao escrever mensagem: %w", err)
	}

	err = writer.Close()
	if err != nil {
		return "", fmt.Errorf("erro ao fechar writer: %w", err)
	}

	return messageID, nil
}

// SendBatchEmails envia um batch de CSVs em um único email
func SendBatchEmails(
	client *SMTPClient,
	users []models.User,
	csvResults []CSVResult,
	toEmail string,
	exportType string,
	batchInfo BatchInfo,
) (*BatchResult, error) {
	// Preparar anexos (ler arquivos)
	attachments := make([]EmailAttachment, 0, len(csvResults))
	errors := make([]string, 0)

	for _, csv := range csvResults {
		fileContent, err := os.ReadFile(csv.FilePath)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Erro ao ler CSV %s: %v", csv.FileName, err))
			continue
		}

		// Dividir em linhas
		lines := strings.Split(string(fileContent), "\n")

		attachments = append(attachments, EmailAttachment{
			Filename: csv.FileName,
			Content:  lines,
		})

		// Agendar limpeza do arquivo temporário
		defer CleanupCSV(csv.FilePath)
	}

	if len(attachments) == 0 {
		return &BatchResult{
			Success:         false,
			BatchNumber:     batchInfo.BatchNumber,
			RecipientsCount: len(users),
			EmailSent:       false,
			Errors:          errors,
		}, fmt.Errorf("nenhum anexo válido")
	}

	// Construir email
	subject := buildEmailSubject(exportType, batchInfo)
	html := buildEmailHTML(exportType, batchInfo, users)

	// Enviar
	messageID, err := client.SendEmail(EmailRequest{
		To:          toEmail,
		Subject:     subject,
		HTML:        html,
		Attachments: attachments,
	})

	if err != nil {
		errors = append(errors, fmt.Sprintf("Erro ao enviar email: %v", err))
		return &BatchResult{
			Success:         false,
			BatchNumber:     batchInfo.BatchNumber,
			RecipientsCount: len(users),
			EmailSent:       false,
			Errors:          errors,
		}, err
	}

	fmt.Printf("Email enviado com sucesso: %s\n", messageID)

	return &BatchResult{
		Success:         true,
		BatchNumber:     batchInfo.BatchNumber,
		RecipientsCount: len(users),
		EmailSent:       true,
		Errors:          errors,
	}, nil
}

// buildEmailSubject constrói assunto do email
func buildEmailSubject(exportType string, batchInfo BatchInfo) string {
	typeLabel := "Exportação de Dados"
	if exportType == "MONTHLY_AUTO" {
		typeLabel = "Relatório Mensal"
	}

	if batchInfo.TotalBatches > 1 {
		return fmt.Sprintf("%s - Lote %d/%d", typeLabel, batchInfo.BatchNumber, batchInfo.TotalBatches)
	}

	return typeLabel
}

// buildEmailHTML constrói HTML do email
func buildEmailHTML(exportType string, batchInfo BatchInfo, users []models.User) string {
	isMonthly := exportType == "MONTHLY_AUTO"
	title := "Relatórios Mensais de Alunos"
	if !isMonthly {
		title = "Exportação de Dados Solicitada"
	}

	batchInfoHTML := ""
	if batchInfo.TotalBatches > 1 {
		batchInfoHTML = fmt.Sprintf(`<p style="color: #666; font-size: 14px; margin-top: 10px;">
      Este é o <strong>lote %d de %d</strong>.
    </p>`, batchInfo.BatchNumber, batchInfo.TotalBatches)
	}

	var userListHTML string
	for _, user := range users {
		userListHTML += fmt.Sprintf(`<li style="margin-bottom: 5px;">• %s (%s)</li>`, user.Name, user.Email)
	}

	return fmt.Sprintf(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">%s</h1>
        </div>
        <div class="content">
          <p>Prezado(a) Administrador(a),</p>
          <p>Em anexo você encontrará os relatórios em CSV dos seguintes alunos:</p>
          <ul style="margin-top: 15px;">
            %s
          </ul>
          %s
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            %s
          </p>
        </div>
        <div class="footer">
          <p><strong>Educa.SA</strong> - Educação Financeira na Sala de Ação</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
    `, title, userListHTML, batchInfoHTML, getAutoMessage(isMonthly))
}

// getAutoMessage retorna mensagem apropriada para exportação automática
func getAutoMessage(isMonthly bool) string {
	if isMonthly {
		return "Estes relatórios foram gerados automaticamente pelo sistema Educa.SA."
	}
	return "Esta exportação foi solicitada manualmente através do painel."
}
