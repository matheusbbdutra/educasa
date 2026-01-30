package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"educasa/internal/api"
	"educasa/internal/config"
	"educasa/internal/database"
	"educasa/internal/worker"

	_ "github.com/joho/godotenv/autoload"
)

func main() {
	// Carregar configuração
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Configurar conexão com banco de dados
	dbConfig := &database.Config{
		Mode:           cfg.DBMode,
		LocalPath:      cfg.DBLocalPath,
		RemoteURL:      cfg.TursoDatabaseURL,
		AuthToken:      cfg.TursoAuthToken,
		SyncInterval:   cfg.DBSyncInterval,
		EncryptionKey:  cfg.DBEncryptionKey,
		ReadYourWrites: true,
	}

	// Se estiver usando Embedded Replica, verificar se diretório existe
	if cfg.DBMode == "embedded" {
		log.Printf("Using Embedded Replica mode")
		log.Printf("Local DB path: %s", cfg.DBLocalPath)
		log.Printf("Sync interval: %v", cfg.DBSyncInterval)

		// Criar diretório se não existir
		dir := cfg.DBLocalPath
		if len(dir) > 0 && dir[0] == '/' {
			// Extrair diretório do caminho do arquivo
			lastSlash := len(dir)
			for i := len(dir) - 1; i >= 0; i-- {
				if dir[i] == '/' {
					lastSlash = i
					break
				}
			}
			if lastSlash > 0 {
				dirPath := dir[:lastSlash]
				if err := os.MkdirAll(dirPath, 0755); err != nil {
					log.Printf("Warning: could not create db directory: %v", err)
				}
			}
		}
	}

	// Conectar ao banco
	db, err := database.Connect(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Inicializar schema do banco
	if err := database.InitSchema(db); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}

	// Criar SyncManager para Embedded Replica
	var syncManager *database.SyncManager
	if cfg.DBMode == "embedded" {
		syncManager = database.NewSyncManager(db, cfg.DBSyncInterval)
		if syncManager != nil {
			syncManager.Start()
			defer syncManager.Stop()
			log.Println("SyncManager started")
		}
	}

	// Criar cliente de email
	emailClient := worker.NewSMTPClient(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
		cfg.SMTPFromEmail,
		cfg.SMTPFromName,
	)

	// Criar job processor
	jobProcessor := worker.NewJobProcessor(db, emailClient, cfg)

	// Criar scheduler
	scheduler := worker.NewScheduler(cfg, db)

	// Configurar função de enfileiramento para o scheduler
	scheduler.SetEnqueueJobFunc(func(ctx context.Context, payload map[string]interface{}) (string, error) {
		// Sync antes de enfileirar job mensal
		if syncManager != nil {
			log.Println("Syncing before monthly job...")
			if result, err := syncManager.SyncWithResult(); err != nil {
				log.Printf("Warning: sync failed before job: %v", err)
			} else {
				log.Printf("Sync completed: %d frames, %v", result.FramesSynced, result.Duration)
			}
		}

		jobType := "MANUAL"
		if t, ok := payload["type"].(string); ok {
			jobType = t
		}
		return api.EnqueueJob(db, jobType, 1, payload)
	})

	// Iniciar scheduler
	if err := scheduler.Start(); err != nil {
		log.Fatalf("Failed to start scheduler: %v", err)
	}
	defer scheduler.Stop()

	// Iniciar worker em background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go jobProcessor.Start(ctx)

	// Configurar servidor HTTP
	router := api.NewRouter(db, jobProcessor, syncManager, cfg.GOWorkerAPIKey)

	server := &http.Server{
		Addr:    fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort),
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down...")
		cancel()

		if syncManager != nil {
			syncManager.Stop()
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("Server started on %s", server.Addr)
	log.Printf("Health check: http://%s/api/v1/health", server.Addr)
	if syncManager != nil {
		log.Printf("Sync status: http://%s/api/v1/sync/status", server.Addr)
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed: %v", err)
	}

	log.Println("Server stopped")
}
