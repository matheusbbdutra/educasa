package models

import "time"

// User represents a user in the system
type User struct {
	ID                string    `json:"id"`
	Email             string    `json:"email"`
	Name              string    `json:"name"`
	Role              string    `json:"role"`
	TurmaID           *string   `json:"turma_id"`
	TurmaName         *string   `json:"turma_name"` // Joined field
	AutoExportConsent bool      `json:"auto_export_consent"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Transaction represents a financial transaction
type Transaction struct {
	ID              string    `json:"id"`
	Description     string    `json:"description"`
	Amount          float64   `json:"amount"`
	Type            string    `json:"type"` // "INCOME" or "EXPENSE"
	Date            time.Time `json:"date"`
	UserID          string    `json:"user_id"`
	CategoryID      *string   `json:"category_id"`
	CategoryName    *string   `json:"category_name"` // Joined field
	SubcategoryID   *string   `json:"subcategory_id"`
	SubcategoryName *string   `json:"subcategory_name"` // Joined field
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
