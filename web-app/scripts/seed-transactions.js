import { createPrismaClient } from './prisma-client.js'

const prisma = createPrismaClient()

// Função para gerar valor aleatório entre min e max
function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Função para gerar data aleatória nos últimos N meses
function randomDate(monthsAgo) {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const endDate = monthsAgo === 0
    ? now
    : new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59)

  const timestamp = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  return new Date(timestamp)
}

// Função para selecionar item aleatório de um array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

async function main() {
  try {
    console.log('🚀 Gerando lançamentos de teste...\n')

    // Buscar usuário de teste
    const student = await prisma.user.findFirst({
      where: { email: 'aluno@educasa.com' }
    })

    if (!student) {
      console.error('❌ Usuário de teste não encontrado!')
      console.log('Execute primeiro: node scripts/create-test-student.js')
      return
    }

    console.log(`✓ Usuário encontrado: ${student.email}`)

    // Buscar categorias GLOBAIS (não mais por usuário)
    const categories = await prisma.category.findMany({
      where: { type: 'EXPENSE' },
      include: {
        subcategories: true
      }
    })

    if (categories.length === 0) {
      console.error('❌ Nenhuma categoria encontrada!')
      console.log('Execute primeiro: node scripts/seed-categories.js')
      return
    }

    console.log(`✓ ${categories.length} categorias IPCA encontradas\n`)

    // Limpar transações antigas do usuário de teste
    const deleted = await prisma.transaction.deleteMany({
      where: { userId: student.id }
    })
    console.log(`🗑️  ${deleted.count} transações antigas removidas\n`)

    let totalTransactions = 0
    let totalIncome = 0
    let totalExpenses = 0

    // Gerar receitas mensais (mesada/salário)
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const incomeDate = new Date()
      incomeDate.setMonth(incomeDate.getMonth() - monthsAgo)
      incomeDate.setDate(5) // Dia 5 de cada mês

      const income = 2000 + randomAmount(-200, 200) // Receita variável

      await prisma.transaction.create({
        data: {
          description: 'Mesada/Salário',
          amount: income,
          date: incomeDate,
          type: 'INCOME',
          userId: student.id
        }
      })

      totalIncome += income
      totalTransactions++
    }

    console.log('✓ Receitas mensais criadas')

    const transactionsPerMonth = {
      0: 50, // Mês atual
      1: 55, // Mês passado
      2: 48  // 2 meses atrás
    }

    // Gerar transações para os últimos 3 meses
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const monthName = new Date(new Date().setMonth(new Date().getMonth() - monthsAgo))
        .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

      console.log(`📅 Gerando despesas para ${monthName}...`)

      const transactionsToCreate = transactionsPerMonth[monthsAgo]

      for (let i = 0; i < transactionsToCreate; i++) {
        // Selecionar categoria aleatória
        const category = randomItem(categories)

        // Selecionar subcategoria aleatória
        if (category.subcategories.length === 0) continue
        const subcategory = randomItem(category.subcategories)

        // Gerar dados da transação com valores mais realistas por categoria
        let amount
        if (category.name === 'Habitação') {
          amount = randomAmount(100, 800)
        } else if (category.name === 'Alimentação e bebidas') {
          amount = randomAmount(10, 150)
        } else if (category.name === 'Transportes') {
          amount = randomAmount(15, 200)
        } else if (category.name === 'Saúde e cuidados pessoais') {
          amount = randomAmount(20, 250)
        } else if (category.name === 'Educação') {
          amount = randomAmount(30, 300)
        } else {
          amount = randomAmount(10, 180)
        }

        const date = randomDate(monthsAgo)

        // Criar transação
        await prisma.transaction.create({
          data: {
            description: `${subcategory.name}`,
            amount: amount,
            date: date,
            type: 'EXPENSE',
            userId: student.id,
            categoryId: category.id,
            subcategoryId: subcategory.id
          }
        })

        totalExpenses += amount
        totalTransactions++
      }

      console.log(`  ✓ ${transactionsToCreate} despesas criadas`)
    }

    const balance = totalIncome - totalExpenses

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Transações geradas com sucesso!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📊 Total de transações: ${totalTransactions}`)
    console.log(`💰 Total de receitas: R$ ${totalIncome.toFixed(2)}`)
    console.log(`💸 Total de despesas: R$ ${totalExpenses.toFixed(2)}`)
    console.log(`📈 Saldo: R$ ${balance.toFixed(2)}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📊 Você pode agora testar o dashboard!')
    console.log('\n🔑 Credenciais de acesso:')
    console.log('   📧 Email: aluno@educasa.com')
    console.log('   🔑 Senha: aluno123\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
