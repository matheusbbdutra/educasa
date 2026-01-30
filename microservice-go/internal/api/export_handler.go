package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"educasa/internal/database"
	"educasa/internal/worker"
)

// ExportCSVHandler gera um CSV e transmite para o cliente
func (h *Handlers) ExportCSVHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1. Validar parâmetros
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	startDateStr := r.URL.Query().Get("startDate")
	endDateStr := r.URL.Query().Get("endDate")

	// Parse datas (default: tudo)
	startDate := time.Time{} // Zero value
	if startDateStr != "" {
		if t, err := time.Parse(time.RFC3339, startDateStr); err == nil {
			startDate = t
		}
	}

	endDate := time.Now()
	if endDateStr != "" {
		if t, err := time.Parse(time.RFC3339, endDateStr); err == nil {
			endDate = t
		}
	}

	ctx := r.Context()

	// 2. Buscar dados do usuário
	users, err := database.GetUsers(ctx, h.db, []string{userID})
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching user: %v", err), http.StatusInternalServerError)
		return
	}
	if len(users) == 0 {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	user := users[0]

	// 3. Buscar transações
	transactionsMap, err := database.GetTransactions(ctx, h.db, []string{userID}, startDate, endDate)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching transactions: %v", err), http.StatusInternalServerError)
		return
	}
	transactions := transactionsMap[userID]

	// 4. Gerar CSV (reutilizando a lógica do worker)
	result, err := worker.GenerateStudentCSV(user, transactions, startDate, endDate)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error generating CSV: %v", err), http.StatusInternalServerError)
		return
	}
	defer worker.CleanupCSV(result.FilePath) // Garantir limpeza mesmo se erro no envio

	// 5. Enviar arquivo
	file, err := os.Open(result.FilePath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error opening CSV: %v", err), http.StatusInternalServerError)
		return
	}
	defer file.Close()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", result.FileName))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", result.FileSize))

	if _, err := io.Copy(w, file); err != nil {
		// Log erro, mas não pode mais mudar header
		fmt.Printf("Error streaming CSV: %v\n", err)
	}
}
