package worker

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"educasa/internal/config"
	"educasa/internal/database"
	"educasa/internal/models"
)

// JobProcessor processa jobs da fila
type JobProcessor struct {
	db          *sql.DB
	emailClient *SMTPClient
	cfg         *config.Config
}

// NewJobProcessor cria um novo processador de jobs
func NewJobProcessor(db *sql.DB, emailClient *SMTPClient, cfg *config.Config) *JobProcessor {
	return &JobProcessor{
		db:          db,
		emailClient: emailClient,
		cfg:         cfg,
	}
}

// Start inicia o processamento de jobs
func (jp *JobProcessor) Start(ctx context.Context) {
	ticker := time.NewTicker(jp.cfg.WorkerPollInterval)
	defer ticker.Stop()

	log.Println("Job processor started")

	for {
		select {
		case <-ctx.Done():
			log.Println("Job processor stopped")
			return
		case <-ticker.C:
			jp.processJobs(ctx)
		}
	}
}

// processJobs busca e processa jobs pendentes
func (jp *JobProcessor) processJobs(ctx context.Context) {
	// Buscar próximos jobs pendentes
	jobs, err := jp.fetchPendingJobs(ctx, jp.cfg.MaxConcurrentJobs)
	if err != nil {
		log.Printf("Error fetching jobs: %v", err)
		return
	}

	if len(jobs) == 0 {
		return
	}

	log.Printf("Processing %d jobs", len(jobs))

	// Processar jobs em paralelo
	for _, job := range jobs {
		go jp.processJob(context.Background(), job)
	}
}

// fetchPendingJobs busca jobs pendentes do banco
func (jp *JobProcessor) fetchPendingJobs(ctx context.Context, limit int) ([]models.Job, error) {
	query := `
		SELECT id, type, status, priority, payload, result, error_message,
		       created_at, started_at, completed_at, retry_count, max_retries, last_retry_at
		FROM export_jobs
		WHERE status = 'PENDING'
		   OR (status = 'FAILED' AND retry_count < max_retries)
		ORDER BY priority DESC, created_at ASC
		LIMIT ?
	`

	rows, err := jp.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	jobs := []models.Job{}
	for rows.Next() {
		log.Println("Fetching job...:%v", rows)
		job, err := models.ScanJob(rows)
		if err != nil {
			log.Printf("Error scanning job: %v", err)
			continue
		}
		jobs = append(jobs, *job)
	}

	return jobs, nil
}

// processJob processa um job individual
func (jp *JobProcessor) processJob(ctx context.Context, job models.Job) {
	log.Printf("Processing job %s (type: %s)", job.ID, job.Type)

	// Atualizar status para PROCESSING
	if err := jp.updateJobStatus(ctx, job.ID, "PROCESSING", nil, ""); err != nil {
		log.Printf("Error updating job status: %v", err)
		// Try again
		time.Sleep(1 * time.Second)
		if err := jp.updateJobStatus(ctx, job.ID, "PROCESSING", nil, ""); err != nil {
			return
		}
	}

	// Processar conforme tipo
	var result map[string]interface{}
	var err error

	switch job.Type {
	case "MANUAL", "MONTHLY_AUTO":
		result, err = jp.processExportJob(ctx, job)
	default:
		err = fmt.Errorf("unknown job type: %s", job.Type)
	}

	// Atualizar status final
	if err != nil {
		log.Printf("Job %s failed: %v", job.ID, err)
		jp.handleJobFailure(ctx, job, err)
	} else {
		log.Printf("Job %s completed successfully", job.ID)
		jp.updateJobStatus(ctx, job.ID, "COMPLETED", result, "")
	}
}

// processExportJob processa um job de exportação
func (jp *JobProcessor) processExportJob(ctx context.Context, job models.Job) (map[string]interface{}, error) {
	// Parse payload
	var payload models.ExportJobPayload
	payloadBytes, _ := json.Marshal(job.Payload)
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, fmt.Errorf("invalid payload: %w", err)
	}

	// Definir batch size padrão se não fornecido
	if payload.BatchSize == 0 {
		payload.BatchSize = jp.cfg.BatchSize
	}

	// Buscar usuários do banco
	users, err := jp.fetchUsers(ctx, payload.UserIDs)
	if err != nil {
		return nil, fmt.Errorf("error fetching users: %w", err)
	}

	log.Printf("Job %s: fetched %d users", job.ID, len(users))

	// Buscar transações
	transactionsMap, err := jp.fetchTransactions(ctx, payload.UserIDs, payload.StartDate, payload.EndDate)
	if err != nil {
		return nil, fmt.Errorf("error fetching transactions: %w", err)
	}

	// Dividir em batches
	batches := jp.divideIntoBatches(users, payload.BatchSize)
	log.Printf("Job %s: %d users divided into %d batches", job.ID, len(users), len(batches))

	// Processar cada batch
	batchResults := make([]map[string]interface{}, 0)

	for i, batch := range batches {
		batchInfo := BatchInfo{
			BatchNumber:  i + 1,
			TotalBatches: len(batches),
			BatchID:      job.ID,
		}

		// Gerar CSVs para o batch
		csvResults := make([]CSVResult, 0, len(batch))
		for _, user := range batch {
			transactions := transactionsMap[user.ID] // This will return nil/empty if not found, which is fine
			csv, err := GenerateStudentCSV(user, transactions, payload.StartDate, payload.EndDate)
			if err != nil {
				log.Printf("Error generating CSV for user %s: %v", user.ID, err)
				continue
			}
			csvResults = append(csvResults, *csv)
		}

		// Enviar email
		batchResult, err := SendBatchEmails(
			jp.emailClient,
			batch,
			csvResults,
			payload.ToEmail,
			job.Type,
			batchInfo,
		)

		if err != nil {
			return nil, fmt.Errorf("error sending batch %d: %w", i+1, err)
		}

		batchResults = append(batchResults, map[string]interface{}{
			"batch_number":     batchResult.BatchNumber,
			"recipients_count": batchResult.RecipientsCount,
			"email_sent":       batchResult.EmailSent,
		})
	}

	return map[string]interface{}{
		"total_users":   len(users),
		"total_batches": len(batches),
		"batch_results": batchResults,
	}, nil
}

// fetchUsers busca usuários do banco
func (jp *JobProcessor) fetchUsers(ctx context.Context, userIDs []string) ([]models.User, error) {
	return database.GetUsers(ctx, jp.db, userIDs)
}

// fetchTransactions busca transações do banco
func (jp *JobProcessor) fetchTransactions(ctx context.Context, userIDs []string, startDate, endDate time.Time) (map[string][]models.Transaction, error) {
	return database.GetTransactions(ctx, jp.db, userIDs, startDate, endDate)
}

// divideIntoBatches divide usuários em batches
func (jp *JobProcessor) divideIntoBatches(users []models.User, batchSize int) [][]models.User {
	var batches [][]models.User

	for i := 0; i < len(users); i += batchSize {
		end := i + batchSize
		if end > len(users) {
			end = len(users)
		}
		batches = append(batches, users[i:end])
	}

	return batches
}

// updateJobStatus atualiza status de um job no banco
func (jp *JobProcessor) updateJobStatus(ctx context.Context, jobID, status string, result map[string]interface{}, errorMessage string) error {
	var resultJSON sql.NullString
	var startedAt, completedAt string

	if status == "PROCESSING" {
		startedAt = time.Now().Format(time.RFC3339)
	} else if status == "COMPLETED" || status == "FAILED" {
		completedAt = time.Now().Format(time.RFC3339)
	}

	if result != nil {
		resultBytes, _ := json.Marshal(result)
		resultJSON = sql.NullString{String: string(resultBytes), Valid: true}
	}

	query := `
		UPDATE export_jobs
		SET status = ?,
		    started_at = COALESCE(?, started_at),
		    completed_at = ?,
		    result = ?,
		    error_message = ?
		WHERE id = ?
	`

	_, err := jp.db.ExecContext(ctx, query, status, startedAt, completedAt, resultJSON, errorMessage, jobID)
	return err
}

// handleJobFailure trata falha de job com retry
func (jp *JobProcessor) handleJobFailure(ctx context.Context, job models.Job, err error) {
	retryCount := job.RetryCount + 1

	if retryCount >= job.MaxRetries {
		// Marcar como FAILED permanentemente
		jp.updateJobStatus(ctx, job.ID, "FAILED", nil, err.Error())
	} else {
		// Marcar como PENDING para retry
		lastRetryAt := time.Now().Format(time.RFC3339)
		query := `
			UPDATE export_jobs
			SET status = 'PENDING',
			    retry_count = ?,
			    last_retry_at = ?
			WHERE id = ?
		`
		jp.db.ExecContext(ctx, query, retryCount, lastRetryAt, job.ID)
	}
}
