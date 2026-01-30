export const useExportCSV = () => {
  /**
   * Converte um array de objetos em string CSV
   */
  const arrayToCSV = (data: any[], headers: string[]) => {
    if (!data || data.length === 0) {
      return ''
    }

    // Cabeçalhos
    const headerRow = headers.join(',')

    // Linhas de dados
    const dataRows = data.map(item => {
      return headers.map(header => {
        const value = item[header]

        // Tratamento de valores
        if (value === null || value === undefined) {
          return ''
        }

        // Se contém vírgula, aspas ou quebra de linha, envolve em aspas
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      }).join(',')
    }).join('\n')

    return `${headerRow}\n${dataRows}`
  }

  /**
   * Gera CSV de transações
   */
  const generateTransactionsCSV = (transactions: any[]) => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Subcategoria', 'Valor']

    const formattedData = transactions.map(transaction => {
      const amount = Number(transaction.amount) || 0
      return {
        'Data': new Date(transaction.date).toLocaleDateString('pt-BR'),
        'Descrição': transaction.description,
        'Categoria': transaction.subcategory?.category?.name || 'Sem categoria',
        'Subcategoria': transaction.subcategory?.name || 'Sem subcategoria',
        'Valor': `R$ ${amount.toFixed(2).replace('.', ',')}`
      }
    })

    return arrayToCSV(formattedData, headers)
  }

  /**
   * Faz download de arquivo CSV
   */
  const downloadCSV = (csvContent: string, filename: string) => {
    // Adiciona BOM para garantir encoding UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Libera o objeto URL
    URL.revokeObjectURL(url)

    return blob
  }

  /**
   * Abre cliente de email com arquivo anexado (usando mailto)
   * Nota: Anexos não são suportados via mailto, então criamos um email com instruções
   */
  const openEmailClient = (subject: string, body: string) => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
  }

  /**
   * Exporta transações como CSV e faz download
   */
  const exportTransactions = (transactions: any[], startDate: Date, endDate: Date) => {
    const csvContent = generateTransactionsCSV(transactions)
    const filename = `transacoes_${startDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}_a_${endDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`

    // Download do CSV
    downloadCSV(csvContent, filename)
  }

  return {
    arrayToCSV,
    generateTransactionsCSV,
    downloadCSV,
    openEmailClient,
    exportTransactions
  }
}
