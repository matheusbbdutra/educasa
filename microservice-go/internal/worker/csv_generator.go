package worker

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"educasa/internal/models"
)

// CSVResult representa o resultado da geração de CSV
type CSVResult struct {
	FilePath    string
	FileName    string
	RecordCount int
	FileSize    int64
}

// GenerateStudentCSV gera CSV com histórico do aluno
// Equivalente ao generateStudentCSV do TypeScript
func GenerateStudentCSV(user models.User, transactions []models.Transaction, startDate, endDate time.Time) (*CSVResult, error) {
	// Criar diretório temporário
	tmpDir := filepath.Join(os.TempDir(), "educasa-exports")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		return nil, fmt.Errorf("erro ao criar diretório: %w", err)
	}

	// Sanitizar nome do arquivo
	sanitizedName := sanitizeFilename(user.Name)
	fileName := fmt.Sprintf("educasa_historico_%s_%d.csv", sanitizedName, time.Now().UnixMilli())
	filePath := filepath.Join(tmpDir, fileName)

	// Criar arquivo
	file, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar arquivo: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 1. Escrever BOM UTF-8 para compatibilidade com Excel
	BOM := []byte{0xEF, 0xBB, 0xBF}
	if _, err := file.Write(BOM); err != nil {
		return nil, fmt.Errorf("erro ao escrever BOM: %w", err)
	}

	// 2. Cabeçalho com dados do aluno
	header := [][]string{
		{"RELATÓRIO DE HISTÓRICO FINANCEIRO"},
		{""},
		{fmt.Sprintf("Nome: %s", user.Name)},
		{fmt.Sprintf("Email: %s", user.Email)},
		{fmt.Sprintf("Turma: %s", getTurmaName(user.TurmaName))}, // Changed Turma to TurmaName
		{fmt.Sprintf("Período: %s a %s", formatDate(startDate), formatDate(endDate))},
		{fmt.Sprintf("Data de Geração: %s", formatDate(time.Now()))},
		{""},
		{"Data", "Descrição", "Categoria", "Subcategoria", "Valor (R$)", "Tipo"},
	}

	for _, row := range header {
		if err := writer.Write(row); err != nil {
			return nil, fmt.Errorf("erro ao escrever cabeçalho: %w", err)
		}
	}

	// 3. Linhas de transações
	for _, t := range transactions {
		row := []string{
			formatDate(t.Date),
			escapeCSV(t.Description),
			escapeCSV(getCategoryName(t.CategoryName)),       // Changed Category to CategoryName
			escapeCSV(getSubcategoryName(t.SubcategoryName)), // Changed Subcategory to SubcategoryName
			formatAmount(t.Amount),
			mapType(t.Type),
		}
		if err := writer.Write(row); err != nil {
			return nil, fmt.Errorf("erro ao escrever transação: %w", err)
		}
	}

	// 4. Resumo financeiro
	summary := calculateSummary(transactions)
	summaryRows := [][]string{
		{""},
		{""},
		{"RESUMO FINANCEIRO"},
		{fmt.Sprintf("Total Receitas,R$ %s", formatAmount(summary.TotalIncome))},
		{fmt.Sprintf("Total Despesas,R$ %s", formatAmount(summary.TotalExpense))},
		{fmt.Sprintf("Saldo,R$ %s", formatAmount(summary.Balance))},
		{""},
		{fmt.Sprintf("Total de Transações,%d", len(transactions))},
	}

	for _, row := range summaryRows {
		if err := writer.Write(row); err != nil {
			return nil, fmt.Errorf("erro ao escrever resumo: %w", err)
		}
	}

	// Obter tamanho do arquivo
	stat, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("erro ao obter stats do arquivo: %w", err)
	}

	return &CSVResult{
		FilePath:    filePath,
		FileName:    fileName,
		RecordCount: len(transactions),
		FileSize:    stat.Size(),
	}, nil
}

// formatDate formata data para PT-BR
func formatDate(date time.Time) string {
	return date.Format("02/01/2006")
}

// formatAmount formata valor monetário para CSV
func formatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}

// mapType converte tipo de transação para português
func mapType(txType string) string {
	if txType == "INCOME" {
		return "Receita"
	}
	return "Despesa"
}

// escapeCSV escapa valores para CSV (aspas, vírgulas, quebras de linha)
func escapeCSV(value string) string {
	if value == "" {
		return ""
	}

	needsQuoting := strings.ContainsAny(value, ",\"\n")
	if !needsQuoting {
		return value
	}

	// Escapar aspas duplicando-as
	escaped := strings.ReplaceAll(value, "\"", "\"\"")
	return fmt.Sprintf("\"%s\"", escaped)
}

// sanitizeFilename remove caracteres não alfanuméricos
func sanitizeFilename(name string) string {
	reg := regexp.MustCompile("[^a-zA-Z0-9]+")
	return reg.ReplaceAllString(name, "_")
}

// getTurmaName retorna nome da turma ou valor padrão
func getTurmaName(turma *string) string {
	if turma == nil {
		return "Não informada"
	}
	return *turma
}

func getCategoryName(category *string) string {
	if category == nil {
		return "Sem categoria"
	}
	return *category
}

func getSubcategoryName(subcategory *string) string {
	if subcategory == nil {
		return ""
	}
	return *subcategory
}

// Summary representa o resumo financeiro
type Summary struct {
	TotalIncome  float64
	TotalExpense float64
	Balance      float64
}

// calculateSummary calcula resumo financeiro das transações
func calculateSummary(transactions []models.Transaction) Summary {
	var income, expense float64

	for _, t := range transactions {
		if t.Type == "INCOME" {
			income += t.Amount
		} else {
			expense += t.Amount
		}
	}

	return Summary{
		TotalIncome:  income,
		TotalExpense: expense,
		Balance:      income - expense,
	}
}

// CleanupCSV remove arquivo temporário
func CleanupCSV(filePath string) error {
	return os.Remove(filePath)
}
