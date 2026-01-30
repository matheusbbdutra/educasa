package models

// Batch representa um batch de exportação
type Batch struct {
	ID             string
	JobID          string
	BatchNumber    int
	TotalBatches   int
	Status         string
	RecipientsCount int
	FilePath       string
	EmailSent      bool
	SentAt         string
	ErrorMessage   string
	CreatedAt      string
}
