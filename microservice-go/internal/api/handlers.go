package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"educasa/internal/database"
	"educasa/internal/worker"
)

// Handlers contém os handlers HTTP
type Handlers struct {
	db              *sql.DB
	jobProcessor    *worker.JobProcessor
	enqueueJobFunc  func(context.Context, map[string]interface{}) (string, error)
	syncManager     *database.SyncManager
}

// NewHandlers cria novos handlers
func NewHandlers(db *sql.DB, jobProcessor *worker.JobProcessor) *Handlers {
	return &Handlers{
		db:           db,
		jobProcessor: jobProcessor,
	}
}

// SetSyncManager define o sync manager
func (h *Handlers) SetSyncManager(sm *database.SyncManager) {
	h.syncManager = sm
}

// SetEnqueueJobFunc define a função para enfileirar jobs
func (h *Handlers) SetEnqueueJobFunc(fn func(context.Context, map[string]interface{}) (string, error)) {
	h.enqueueJobFunc = fn
}

// EnqueueJobHandler enfileira um novo job
func (h *Handlers) EnqueueJobHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Type     string                 `json:"type"`
		Priority int                    `json:"priority,omitempty"`
		Payload  map[string]interface{} `json:"payload"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validar tipo
	if req.Type != "MANUAL" && req.Type != "MONTHLY_AUTO" {
		http.Error(w, "Invalid job type", http.StatusBadRequest)
		return
	}

	// Enfileirar job
	ctx := r.Context()
	jobID, err := h.enqueueJobFunc(ctx, req.Payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"job_id": jobID,
		"status": "PENDING",
	})
}

// JobStatusHandler retorna status de um job
func (h *Handlers) JobStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extrair job ID da URL
	// TODO: Implementar parsing correto da URL
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Job status handler - TODO",
	})
}

// QueueHandler lista jobs na fila
func (h *Handlers) QueueHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Contar jobs por status
	query := `
		SELECT status, COUNT(*) as count
		FROM export_jobs
		GROUP BY status
	`

	rows, err := h.db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	summary := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			continue
		}
		summary[status] = count
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"summary": summary,
	})
}

// HealthHandler retorna health status
func (h *Handlers) HealthHandler(w http.ResponseWriter, r *http.Request) {
	// Check database
	if err := h.db.Ping(); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status":   "unhealthy",
			"database": "disconnected",
		})
		return
	}

	// Contar jobs pendentes
	var queueSize int
	h.db.QueryRow("SELECT COUNT(*) FROM export_jobs WHERE status = 'PENDING'").Scan(&queueSize)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "healthy",
		"database":      "connected",
		"queue_size":    queueSize,
		"worker_status": "running",
		"timestamp":     time.Now().Format(time.RFC3339),
	})
}

// EnqueueJob enfileira um job no banco de dados
func EnqueueJob(db *sql.DB, jobType string, priority int, payload map[string]interface{}) (string, error) {
	jobID := fmt.Sprintf("job_%d", time.Now().UnixNano())

	payloadBytes, _ := json.Marshal(payload)

	query := `
		INSERT INTO export_jobs (id, type, status, priority, payload)
		VALUES (?, ?, 'PENDING', ?, ?)
	`

	_, err := db.Exec(query, jobID, jobType, priority, string(payloadBytes))
	if err != nil {
		return "", err
	}

	return jobID, nil
}

// SyncStatusHandler retorna o status do sync
func (h *Handlers) SyncStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.syncManager == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"enabled": false,
			"message": "Sync not available (cloud mode)",
		})
		return
	}

	status := h.syncManager.GetStatus()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// SyncNowHandler executa um sync manual
func (h *Handlers) SyncNowHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if h.syncManager == nil {
		http.Error(w, "Sync not available (cloud mode)", http.StatusServiceUnavailable)
		return
	}

	result, err := h.syncManager.SyncWithResult()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
