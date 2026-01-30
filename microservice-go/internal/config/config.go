package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Turso Database
	TursoDatabaseURL string
	TursoAuthToken   string

	// Embedded Replica Configuration
	DBMode           string        // "cloud" ou "embedded"
	DBLocalPath      string        // Caminho do arquivo local
	DBSyncInterval   time.Duration // Intervalo de sync automático
	DBEncryptionKey  string        // Chave de criptografia opcional

	// SMTP Email
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	SMTPFromEmail string
	SMTPFromName  string

	// API Security
	GOWorkerAPIKey string

	// Worker Configuration
	BatchSize          int
	MaxConcurrentJobs  int
	WorkerPollInterval time.Duration
	JobTimeout         time.Duration

	// Scheduler
	EnableScheduler bool
	MonthlyCron     string

	// Server
	ServerPort string
	ServerHost string
	LogLevel   string
	LogFormat  string
}

func Load() (*Config, error) {
	// Load .env file if exists
	_ = os.Setenv("TZ", "America/Sao_Paulo")

	// Conexão direta ao Turso Cloud
	dbURL := getEnv("TURSO_DATABASE_URL", "")
	if dbURL == "" {
		return nil, &ConfigError{Field: "TURSO_DATABASE_URL", Message: "is required"}
	}

	cfg := &Config{
		TursoDatabaseURL:   dbURL,
		TursoAuthToken:     getEnv("TURSO_AUTH_TOKEN", ""),
		DBMode:             getEnv("GO_DB_MODE", "cloud"),
		DBLocalPath:        getEnv("GO_DB_PATH", "/data/worker.db"),
		DBSyncInterval:     getEnvDuration("GO_SYNC_INTERVAL", 24*time.Hour),
		DBEncryptionKey:    getEnv("GO_DB_ENCRYPTION_KEY", ""),
		SMTPHost:           getEnv("SMTP_HOST", "smtp.zeptomail.com"),
		SMTPPort:           getEnvInt("SMTP_PORT", 587),
		SMTPUsername:       getEnv("SMTP_USERNAME", "emailapikey"),
		SMTPPassword:       getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail:      getEnv("SMTP_FROM_EMAIL", "noreply@educasa.app.br"),
		SMTPFromName:       getEnv("SMTP_FROM_NAME", "Educa.SA"),
		GOWorkerAPIKey:     getEnv("GO_WORKER_API_KEY", ""),
		BatchSize:          getEnvInt("BATCH_SIZE", 20),
		MaxConcurrentJobs:  getEnvInt("MAX_CONCURRENT_JOBS", 3),
		WorkerPollInterval: getEnvDuration("WORKER_POLL_INTERVAL", 1*time.Minute),
		JobTimeout:         getEnvDuration("JOB_TIMEOUT_MINUTES", 30*time.Minute) * time.Duration(getEnvInt("JOB_TIMEOUT_MINUTES", 30)),
		EnableScheduler:    getEnvBool("ENABLE_SCHEDULER", true),
		MonthlyCron:        getEnv("MONTHLY_CRON", "0 0 1 * *"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		ServerHost:         getEnv("SERVER_HOST", "0.0.0.0"),
		LogLevel:           getEnv("GO_LOG_LEVEL", "info"),
		LogFormat:          getEnv("GO_LOG_FORMAT", "json"),
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	if c.TursoDatabaseURL == "" {
		return &ConfigError{Field: "TURSO_DATABASE_URL", Message: "is required"}
	}
	if c.GOWorkerAPIKey == "" {
		return &ConfigError{Field: "GO_WORKER_API_KEY", Message: "is required"}
	}
	return nil
}

type ConfigError struct {
	Field   string
	Message string
}

func (e *ConfigError) Error() string {
	return e.Field + " " + e.Message
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if b, err := strconv.ParseBool(value); err == nil {
			return b
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}
