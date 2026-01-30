package api

import (
	"context"
	"database/sql"

	"educasa/internal/database"
	"educasa/internal/worker"

	"github.com/gorilla/mux"
)

// NewRouter cria um novo router com todas as rotas
func NewRouter(db *sql.DB, jobProcessor interface{}, syncManager *database.SyncManager, apiKey string) *mux.Router {
	router := mux.NewRouter()

	handlers := NewHandlers(db, jobProcessor.(*worker.JobProcessor))
	handlers.SetSyncManager(syncManager)

	// Configurar função de enfileiramento
	handlers.SetEnqueueJobFunc(func(ctx context.Context, payload map[string]interface{}) (string, error) {
		jobType := "MANUAL"
		if t, ok := payload["type"].(string); ok {
			jobType = t
		}
		priority := 0
		if p, ok := payload["priority"].(float64); ok {
			priority = int(p)
		}
		return EnqueueJob(db, jobType, priority, payload)
	})

	// Middlewares
	router.Use(CORSMiddleware)
	router.Use(APIKeyMiddleware(apiKey))
	router.Use(LoggingMiddleware)

	// Rotas
	api := router.PathPrefix("/api/v1").Subrouter()

	// Jobs
	api.HandleFunc("/jobs/enqueue", handlers.EnqueueJobHandler).Methods("POST", "OPTIONS")
	api.HandleFunc("/jobs/{id}/status", handlers.JobStatusHandler).Methods("GET")
	api.HandleFunc("/jobs/queue", handlers.QueueHandler).Methods("GET")

	// Export
	api.HandleFunc("/export/csv", handlers.ExportCSVHandler).Methods("GET")

	// Sync (Embedded Replica)
	api.HandleFunc("/sync/status", handlers.SyncStatusHandler).Methods("GET")
	api.HandleFunc("/sync", handlers.SyncNowHandler).Methods("POST", "OPTIONS")

	// Health
	api.HandleFunc("/health", handlers.HealthHandler).Methods("GET")

	return router
}
