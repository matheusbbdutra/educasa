package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/tursodatabase/go-libsql"
)

// Config holds database configuration
type Config struct {
	Mode           string        // "cloud" ou "embedded"
	LocalPath      string        // Caminho do arquivo local
	RemoteURL      string        // URL do Turso Cloud
	AuthToken      string
	SyncInterval   time.Duration // Intervalo de sync automático
	EncryptionKey  string        // Opcional
	ReadYourWrites bool          // Default: true
}

// Connect cria uma nova conexão com Turso (Cloud ou Embedded Replica)
func Connect(cfg *Config) (*sql.DB, error) {
	var connector *libsql.Connector
	var err error

	switch cfg.Mode {
	case "embedded":
		// Embedded Replica Mode
		connector, err = createEmbeddedConnector(cfg)
		if err != nil {
			return nil, fmt.Errorf("failed to create embedded connector: %w", err)
		}
	case "cloud":
		// Direct Cloud Mode (fallback) - usa url direta com sql.Open
		return connectCloud(cfg)
	default:
		return nil, fmt.Errorf("invalid mode: %s (use 'cloud' or 'embedded')", cfg.Mode)
	}

	db := sql.OpenDB(connector)

	// Configurar pool de conexões
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	// Testar conexão
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}

	fmt.Printf("Connected to Turso (mode=%s, local=%s)\n", cfg.Mode, cfg.LocalPath)
	return db, nil
}

// connectCloud cria uma conexão direta ao Turso Cloud (sem embedded replica)
func connectCloud(cfg *Config) (*sql.DB, error) {
	url := cfg.RemoteURL
	if cfg.AuthToken != "" {
		url = fmt.Sprintf("%s?authToken=%s", cfg.RemoteURL, cfg.AuthToken)
	}

	db, err := sql.Open("libsql", url)
	if err != nil {
		return nil, fmt.Errorf("failed to open db: %w", err)
	}

	// Configurar pool de conexões
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	// Testar conexão
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}

	fmt.Printf("Connected to Turso Cloud (mode=cloud)\n")
	return db, nil
}

// createEmbeddedConnector cria um conector para Embedded Replica
func createEmbeddedConnector(cfg *Config) (*libsql.Connector, error) {
	// Verificar se diretório existe
	dir := filepath.Dir(cfg.LocalPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	opts := []libsql.Option{
		libsql.WithAuthToken(cfg.AuthToken),
		libsql.WithSyncInterval(cfg.SyncInterval),
	}

	if cfg.EncryptionKey != "" {
		opts = append(opts, libsql.WithEncryption(cfg.EncryptionKey))
	}

	if !cfg.ReadYourWrites {
		opts = append(opts, libsql.WithReadYourWrites(false))
	}

	connector, err := libsql.NewEmbeddedReplicaConnector(
		cfg.LocalPath,
		cfg.RemoteURL,
		opts...,
	)
	if err != nil {
		return nil, err
	}

	return connector, nil
}

// Syncer define operações de sync para embedded replicas
type Syncer interface {
	Sync() (libsql.Replicated, error)
}

// GetSyncer retorna a interface de sync se disponível
func GetSyncer(db *sql.DB) (Syncer, bool) {
	// O connector libsql implementa Sync() quando é Embedded Replica
	type syncer interface {
		Sync() (libsql.Replicated, error)
	}

	if s, ok := db.Driver().(syncer); ok {
		return s, true
	}
	return nil, false
}
