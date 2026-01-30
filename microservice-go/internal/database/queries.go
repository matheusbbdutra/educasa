package database

import (
	"context"
	"database/sql"
	"educasa/internal/models"
	"fmt"
	"strings"
	"time"
)

// GetUsers fetches users by their IDs
func GetUsers(ctx context.Context, db *sql.DB, userIDs []string) ([]models.User, error) {
	if len(userIDs) == 0 {
		return []models.User{}, nil
	}

	placeholders := make([]string, len(userIDs))
	args := make([]interface{}, len(userIDs))
	for i, id := range userIDs {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT u.id, u.email, u.name, u.role, u.turmaId, t.name, u.autoExportConsent, u.createdAt, u.updatedAt
		FROM users u
		LEFT JOIN turmas t ON u.turmaId = t.id
		WHERE u.id IN (%s)
	`, strings.Join(placeholders, ","))

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.Email, &u.Name, &u.Role, &u.TurmaID, &u.TurmaName, &u.AutoExportConsent, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, nil
}

// GetTransactions fetches transactions for specific users within a date range
func GetTransactions(ctx context.Context, db *sql.DB, userIDs []string, startDate, endDate time.Time) (map[string][]models.Transaction, error) {
	if len(userIDs) == 0 {
		return make(map[string][]models.Transaction), nil
	}

	placeholders := make([]string, len(userIDs))
	args := make([]interface{}, len(userIDs)+2) // +2 for startDate and endDate
	for i, id := range userIDs {
		placeholders[i] = "?"
		args[i] = id
	}
	// Note: SQLite/Turso stores dates as strings usually, but Prisma might store as timestamps.
	// Checking the schema, it says DateTime. In SQLite via Prisma it's often milliseconds or ISO string.
	// We'll trust the driver/Prisma behavior for now but might need adjustment if queries return empty.
	// Assuming LibSQL adapter acts similar to standard SQLite.
	args[len(userIDs)] = startDate
	args[len(userIDs)+1] = endDate

	// Join with categories and subcategories
	query := fmt.Sprintf(`
		SELECT t.id, t.description, t.amount, t.type, t.date, t.userId, 
		       c.id, c.name, s.id, s.name, t.createdAt, t.updatedAt
		FROM transactions t
		LEFT JOIN categories c ON t.categoryId = c.id
		LEFT JOIN subcategories s ON t.subcategoryId = s.id
		WHERE t.userId IN (%s)
		  AND t.date >= ? AND t.date <= ?
		ORDER BY t.date ASC
	`, strings.Join(placeholders, ","))

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]models.Transaction)
	for rows.Next() {
		var t models.Transaction
		err := rows.Scan(
			&t.ID, &t.Description, &t.Amount, &t.Type, &t.Date, &t.UserID,
			&t.CategoryID, &t.CategoryName, &t.SubcategoryID, &t.SubcategoryName, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		result[t.UserID] = append(result[t.UserID], t)
	}

	return result, nil
}

// GetConsentingStudents fetches all students who consented to auto-export
func GetConsentingStudents(ctx context.Context, db *sql.DB) ([]models.User, error) {
	query := `
		SELECT u.id, u.email, u.name, u.role, u.turmaId, t.name, u.autoExportConsent, u.createdAt, u.updatedAt
		FROM users u
		LEFT JOIN turmas t ON u.turmaId = t.id
		WHERE u.role = 'STUDENT' AND u.autoExportConsent = 1
	`
	// Note: Boolean in SQLite is usually 0/1

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.Email, &u.Name, &u.Role, &u.TurmaID, &u.TurmaName, &u.AutoExportConsent, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	return users, nil
}
