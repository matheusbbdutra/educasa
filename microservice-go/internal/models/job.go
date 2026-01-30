package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

// Job representa um job de exportação
type Job struct {
	ID           string
	Type         string // "MANUAL" ou "MONTHLY_AUTO"
	Status       string // "PENDING", "PROCESSING", "COMPLETED", "FAILED"
	Priority     int
	Payload      map[string]interface{}
	Result       map[string]interface{}
	ErrorMessage *string // NULL no banco de dados
	CreatedAt    time.Time
	StartedAt    *time.Time
	CompletedAt  *time.Time
	RetryCount   int
	MaxRetries   int
	LastRetryAt  *time.Time
}

// ExportJobPayload representa o payload de um job de exportação
type ExportJobPayload struct {
	UserIDs        []string  `json:"user_ids,omitempty"`
	TurmaName      string    `json:"turma_name,omitempty"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	ToEmail        string    `json:"to_email"`
	BatchSize      int       `json:"batch_size,omitempty"`
	ExportRecordID string    `json:"export_record_id,omitempty"`
	Subject        string    `json:"subject,omitempty"`
}

// ScanJob lê um job do banco de dados
func ScanJob(row *sql.Rows) (*Job, error) {
	var j Job
	var payloadJSON, resultJSON, errorMessage sql.NullString
	var createdAtStr, startedAtStr, completedAtStr, lastRetryAtStr sql.NullString

	err := row.Scan(
		&j.ID,
		&j.Type,
		&j.Status,
		&j.Priority,
		&payloadJSON,
		&resultJSON,
		&errorMessage,
		&createdAtStr,
		&startedAtStr,
		&completedAtStr,
		&j.RetryCount,
		&j.MaxRetries,
		&lastRetryAtStr,
	)

	if err != nil {
		return nil, err
	}

	// Parse payload JSON
	if payloadJSON.Valid {
		if err := json.Unmarshal([]byte(payloadJSON.String), &j.Payload); err != nil {
			return nil, err
		}
	}

	// Parse result JSON
	if resultJSON.Valid {
		if err := json.Unmarshal([]byte(resultJSON.String), &j.Result); err != nil {
			return nil, err
		}
	}

	// Parse error message
	if errorMessage.Valid {
		j.ErrorMessage = &errorMessage.String
	}

	// Parse created_at (obrigatório)
	if createdAtStr.Valid && createdAtStr.String != "" {
		createdAt, err := time.Parse("2006-01-02 15:04:05", createdAtStr.String)
		if err != nil {
			// Tenta outros formatos comuns
			createdAt, err = time.Parse(time.RFC3339, createdAtStr.String)
			if err != nil {
				return nil, err
			}
		}
		j.CreatedAt = createdAt
	}

	// Parse nullable times
	if startedAtStr.Valid && startedAtStr.String != "" {
		startedAt, err := time.Parse("2006-01-02 15:04:05", startedAtStr.String)
		if err != nil {
			startedAt, err = time.Parse(time.RFC3339, startedAtStr.String)
			if err != nil {
				return nil, err
			}
		}
		j.StartedAt = &startedAt
	}

	if completedAtStr.Valid && completedAtStr.String != "" {
		completedAt, err := time.Parse("2006-01-02 15:04:05", completedAtStr.String)
		if err != nil {
			completedAt, err = time.Parse(time.RFC3339, completedAtStr.String)
			if err != nil {
				return nil, err
			}
		}
		j.CompletedAt = &completedAt
	}

	if lastRetryAtStr.Valid && lastRetryAtStr.String != "" {
		lastRetryAt, err := time.Parse("2006-01-02 15:04:05", lastRetryAtStr.String)
		if err != nil {
			lastRetryAt, err = time.Parse(time.RFC3339, lastRetryAtStr.String)
			if err != nil {
				return nil, err
			}
		}
		j.LastRetryAt = &lastRetryAt
	}

	return &j, nil
}
