package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/tursodatabase/go-libsql"
)

// SyncManager gerencia sincronização de Embedded Replicas
type SyncManager struct {
	db           *sql.DB
	syncer       Syncer
	syncInterval time.Duration
	ticker       *time.Ticker
	stopChan     chan struct{}
	lastSync     time.Time
	syncCount    int64
}

// NewSyncManager cria um novo SyncManager
func NewSyncManager(db *sql.DB, interval time.Duration) *SyncManager {
	syncer, hasSync := GetSyncer(db)
	if !hasSync {
		log.Println("Warning: Database does not support sync (cloud mode)")
		return nil
	}

	return &SyncManager{
		db:           db,
		syncer:       syncer,
		syncInterval: interval,
		stopChan:     make(chan struct{}),
	}
}

// Start inicia o sync periódico
func (sm *SyncManager) Start() {
	if sm == nil {
		return
	}

	sm.ticker = time.NewTicker(sm.syncInterval)
	log.Printf("SyncManager started (interval=%v)", sm.syncInterval)

	go func() {
		for {
			select {
			case <-sm.ticker.C:
				if _, err := sm.Sync(); err != nil {
					log.Printf("Sync error: %v", err)
				}
			case <-sm.stopChan:
				return
			}
		}
	}()
}

// Stop para o sync periódico
func (sm *SyncManager) Stop() {
	if sm == nil {
		return
	}
	if sm.ticker != nil {
		sm.ticker.Stop()
	}
	close(sm.stopChan)
}

// Sync executa um sync manual
func (sm *SyncManager) Sync() (libsql.Replicated, error) {
	if sm == nil || sm.syncer == nil {
		return libsql.Replicated{}, fmt.Errorf("sync not available")
	}

	start := time.Now()
	replicated, err := sm.syncer.Sync()
	if err != nil {
		return libsql.Replicated{}, fmt.Errorf("sync failed: %w", err)
	}

	sm.lastSync = time.Now()
	sm.syncCount++
	duration := time.Since(start)

	log.Printf("Sync completed in %v (frames=%d, frame_no=%d, count=%d)",
		duration, replicated.FramesSynced, replicated.FrameNo, sm.syncCount)

	return replicated, nil
}

// GetStatus retorna o status atual do sync
func (sm *SyncManager) GetStatus() SyncStatus {
	if sm == nil {
		return SyncStatus{Enabled: false}
	}

	return SyncStatus{
		Enabled:    true,
		LastSync:   sm.lastSync,
		SyncCount:  sm.syncCount,
		Interval:   sm.syncInterval,
		NextSync:   sm.lastSync.Add(sm.syncInterval),
	}
}

// SyncStatus representa o status do sync
type SyncStatus struct {
	Enabled   bool           `json:"enabled"`
	LastSync  time.Time      `json:"last_sync"`
	SyncCount int64          `json:"sync_count"`
	Interval  time.Duration  `json:"interval"`
	NextSync  time.Time      `json:"next_sync"`
}

// SyncResult representa o resultado de um sync
type SyncResult struct {
	Status       string         `json:"status"`
	Timestamp    time.Time      `json:"timestamp"`
	FramesSynced int            `json:"frames_synced"`
	FrameNo      int            `json:"frame_no"`
	Duration     time.Duration  `json:"duration_ms"`
}

// SyncWithResult executa um sync e retorna detalhes
func (sm *SyncManager) SyncWithResult() (*SyncResult, error) {
	if sm == nil || sm.syncer == nil {
		return nil, fmt.Errorf("sync not available")
	}

	start := time.Now()
	replicated, err := sm.syncer.Sync()
	duration := time.Since(start)

	if err != nil {
		return nil, fmt.Errorf("sync failed: %w", err)
	}

	sm.lastSync = time.Now()
	sm.syncCount++

	return &SyncResult{
		Status:       "synced",
		Timestamp:    sm.lastSync,
		FramesSynced: replicated.FramesSynced,
		FrameNo:      replicated.FrameNo,
		Duration:     duration,
	}, nil
}
