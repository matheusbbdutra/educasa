package worker

import (
	"context"
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"educasa/internal/config"
)

// Scheduler gerencia jobs agendados (cron)
type Scheduler struct {
	cfg            *config.Config
	db             interface{} // *sql.DB - usar interface para evitar import circular
	cron           *cron.Cron
	enqueueJobFunc func(context.Context, map[string]interface{}) (string, error)
}

// NewScheduler cria um novo scheduler
func NewScheduler(cfg *config.Config, db interface{}) *Scheduler {
	return &Scheduler{
		cfg:  cfg,
		db:   db,
		cron: cron.New(),
	}
}

// SetEnqueueJobFunc define a função para enfileirar jobs
func (s *Scheduler) SetEnqueueJobFunc(fn func(context.Context, map[string]interface{}) (string, error)) {
	s.enqueueJobFunc = fn
}

// Start inicia o scheduler
func (s *Scheduler) Start() error {
	if !s.cfg.EnableScheduler {
		log.Println("Scheduler disabled")
		return nil
	}

	// Adicionar job mensal
	_, err := s.cron.AddFunc(s.cfg.MonthlyCron, func() {
		s.EnqueueMonthlyJob()
	})

	if err != nil {
		return err
	}

	s.cron.Start()
	log.Printf("Scheduler started with cron: %s", s.cfg.MonthlyCron)
	return nil
}

// Stop para o scheduler
func (s *Scheduler) Stop() {
	log.Println("Stopping scheduler")
	ctx := s.cron.Stop()
	<-ctx.Done()
}

// EnqueueMonthlyJob enfileira o job de exportação mensal
func (s *Scheduler) EnqueueMonthlyJob() {
	log.Println("Running monthly export job")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Calcular período do mês anterior
	now := time.Now()
	lastMonth := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, time.Local)
	endOfLastMonth := time.Date(now.Year(), now.Month(), 0, 23, 59, 59, 0, time.Local)

	// TODO: Buscar alunos com consentimento do banco
	// Por enquanto, cria job stub
	payload := map[string]interface{}{
		"start_date": lastMonth.Format(time.RFC3339),
		"end_date":   endOfLastMonth.Format(time.RFC3339),
		"to_email":   s.cfg.SMTPFromEmail,
		"type":       "MONTHLY_AUTO",
	}

	if s.enqueueJobFunc != nil {
		jobID, err := s.enqueueJobFunc(ctx, payload)
		if err != nil {
			log.Printf("Error enqueuing monthly job: %v", err)
		} else {
			log.Printf("Monthly export job enqueued: %s", jobID)
		}
	} else {
		log.Println("Warning: enqueueJobFunc not set, monthly job not created")
	}
}
