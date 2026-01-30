import fs from 'fs/promises'
import path from 'path'

interface User {
  id: string
  name: string
  email: string
  turma?: {
    id: string
    name: string
  } | null
}

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: {
    name: string
  } | null
  subcategory: {
    name: string
  } | null
}

interface CSVResult {
  filePath: string
  fileName: string
}

/**
 * Gera CSV para exportação individual (download)
 * Usado por GET /api/transactions/export
 */
export async function generateStudentCSV(options: {
  user: User
  transactions: Transaction[]
  startDate: Date
  endDate: Date
}): Promise<CSVResult> {
  const { user, transactions, startDate, endDate } = options

  // 1. Calcular resumo financeiro
  let totalIncome = 0
  let totalExpenses = 0
  const categoryTotals: Record<string, number> = {}

  transactions.forEach(t => {
    if (t.type === 'INCOME') {
      totalIncome += Number(t.amount)
    } else {
      totalExpenses += Number(t.amount)
      const categoryName = t.category?.name || 'Sem categoria'
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Number(t.amount)
    }
  })

  const balance = totalIncome - totalExpenses

  // 2. Gerar CSV
  const turmaName = user.turma?.name || 'Sem turma'
  const fileName = `Educasa_${turmaName}_${user.name.replace(/\s+/g, '_')}_${startDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`

  const lines: string[] = []

  // Cabeçalho
  lines.push('Data;Descrição;Categoria;Subcategoria;Tipo;Valor (R$)')

  // Linhas de dados
  transactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString('pt-BR')
    const value = (Number(t.amount) / 100).toFixed(2)
    lines.push(`${date};"${t.description}";"${t.category?.name || ''}";"${t.subcategory?.name || ''}";${t.type === 'INCOME' ? 'Receita' : 'Despesa'}';${value}`)
  })

  // Resumo
  lines.push('')
  lines.push(`RESUMO FINANCEIRO;`)
  lines.push(`Total Receitas;R$ ${(totalIncome / 100).toFixed(2)}`)
  lines.push(`Total Despesas;R$ ${(totalExpenses / 100).toFixed(2)}`)
  lines.push(`Saldo;R$ ${(balance / 100).toFixed(2)}`)
  lines.push('')
  lines.push(`TOTAL POR CATEGORIA;`)
  Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, total]) => {
    lines.push(`${cat};R$ ${(total / 100).toFixed(2)}`)
  })

  // 3. Criar arquivo temporário com BOM UTF-8
  const tmpDir = path.join(process.cwd(), 'tmp', 'exports')
  await fs.mkdir(tmpDir, { recursive: true })

  const filePath = path.join(tmpDir, fileName)
  const bom = '\uFEFF' // BOM UTF-8 para Excel
  const content = bom + lines.join('\n')

  await fs.writeFile(filePath, content, 'utf-8')

  return { filePath, fileName }
}

/**
 * Limpa arquivo CSV temporário
 */
export async function cleanupCSV(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.warn('Erro ao limpar arquivo CSV:', error)
  }
}
