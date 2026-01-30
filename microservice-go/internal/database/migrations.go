package database

import (
	"database/sql"
	"fmt"
)

// InitSchema cria as tabelas necessárias para o worker
func InitSchema(db *sql.DB) error {
	// Tabela de jobs
	jobTableSQL := `
	CREATE TABLE IF NOT EXISTS export_jobs (
		id TEXT PRIMARY KEY,
		type TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'PENDING',
		priority INTEGER DEFAULT 0,
		payload TEXT NOT NULL,
		result TEXT,
		error_message TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		started_at DATETIME,
		completed_at DATETIME,
		retry_count INTEGER DEFAULT 0,
		max_retries INTEGER DEFAULT 3,
		last_retry_at DATETIME
	);`

	if _, err := db.Exec(jobTableSQL); err != nil {
		return fmt.Errorf("failed to create export_jobs table: %w", err)
	}

	// Índices para jobs
	jobIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);",
		"CREATE INDEX IF NOT EXISTS idx_export_jobs_priority ON export_jobs(priority DESC, created_at);",
	}

	for _, idx := range jobIndexes {
		if _, err := db.Exec(idx); err != nil {
			return fmt.Errorf("failed to create job index: %w", err)
		}
	}

	// Tabela de batches
	batchTableSQL := `
	CREATE TABLE IF NOT EXISTS export_batches (
		id TEXT PRIMARY KEY,
		job_id TEXT NOT NULL,
		batch_number INTEGER NOT NULL,
		total_batches INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'PENDING',
		recipients_count INTEGER NOT NULL,
		file_path TEXT,
		email_sent BOOLEAN DEFAULT 0,
		sent_at DATETIME,
		error_message TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (job_id) REFERENCES export_jobs(id) ON DELETE CASCADE
	);`

	if _, err := db.Exec(batchTableSQL); err != nil {
		return fmt.Errorf("failed to create export_batches table: %w", err)
	}

	// Índices para batches
	batchIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_export_batches_job_id ON export_batches(job_id);",
	}

	for _, idx := range batchIndexes {
		if _, err := db.Exec(idx); err != nil {
			return fmt.Errorf("failed to create batch index: %w", err)
		}
	}

	fmt.Println("Database schema initialized successfully")
	return nil
}
