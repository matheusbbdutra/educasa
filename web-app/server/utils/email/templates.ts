import type { StudentReportData } from '../../workers/types'

/**
 * Templates de email HTML
 */

/**
 * Template para relatório de aluno
 */
export function studentReportTemplate(data: {
    userName: string
    reportPeriod: { start: Date; end: Date }
    summary: {
        totalIncome: number
        totalExpenses: number
        balance: number
        transactionCount: number
    }
    topCategories: Array<{ name: string; total: number; percentage: number }>
}): string {
    const { userName, reportPeriod, summary, topCategories } = data

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date)
    }

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Financeiro - Educasa</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #4f46e5;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4f46e5;
      margin: 0;
      font-size: 24px;
    }
    .period {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    .summary {
      display: grid;
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-item {
      padding: 15px;
      border-radius: 6px;
      background-color: #f9fafb;
    }
    .summary-item.positive {
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
    }
    .summary-item.negative {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
    }
    .summary-item.neutral {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
    }
    .summary-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      margin-top: 5px;
    }
    .categories {
      margin-top: 30px;
    }
    .categories h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .category-item:last-child {
      border-bottom: none;
    }
    .category-name {
      font-weight: 500;
    }
    .category-amount {
      font-weight: bold;
      color: #ef4444;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Financeiro</h1>
      <p class="period">
        Período: ${formatDate(reportPeriod.start)} - ${formatDate(reportPeriod.end)}
      </p>
    </div>

    <p>Olá, <strong>${userName}</strong>!</p>
    <p>Aqui está o resumo das suas finanças no período:</p>

    <div class="summary">
      <div class="summary-item positive">
        <div class="summary-label">Receitas</div>
        <div class="summary-value">${formatCurrency(summary.totalIncome)}</div>
      </div>

      <div class="summary-item negative">
        <div class="summary-label">Despesas</div>
        <div class="summary-value">${formatCurrency(summary.totalExpenses)}</div>
      </div>

      <div class="summary-item neutral">
        <div class="summary-label">Saldo</div>
        <div class="summary-value">${formatCurrency(summary.balance)}</div>
      </div>

      <div class="summary-item">
        <div class="summary-label">Total de Transações</div>
        <div class="summary-value">${summary.transactionCount}</div>
      </div>
    </div>

    ${topCategories.length > 0 ? `
    <div class="categories">
      <h2>Principais Categorias de Despesas</h2>
      ${topCategories.map(cat => `
        <div class="category-item">
          <span class="category-name">${cat.name}</span>
          <span class="category-amount">${formatCurrency(cat.total)} (${cat.percentage.toFixed(1)}%)</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <p>Este é um email automático do sistema Educasa.</p>
      <p>Continue acompanhando suas finanças na plataforma!</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Template simples para boas-vindas (futuro)
 */
export function welcomeTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Educasa</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #4f46e5;">Bem-vindo ao Educasa, ${userName}!</h1>
  <p>Estamos felizes em tê-lo conosco.</p>
  <p>Comece a gerenciar suas finanças de forma inteligente!</p>
</body>
</html>
  `.trim()
}
