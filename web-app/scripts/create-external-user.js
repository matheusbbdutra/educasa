import bcrypt from 'bcrypt'
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
    console.log('🚀 Criando usuário externo de teste...\n')

    // Verificar se já existe
    const existingUser = await prisma.user.findFirst({
      where: { email: 'externo@educasa.com' }
    })

    if (existingUser) {
      console.log('⚠️  Usuário externo já existe!')
      console.log('Email:', existingUser.email)
      console.log('Role:', existingUser.role)

      // Atualizar senha
      const hashedPassword = await bcrypt.hash('externo123', 10)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Senha atualizada para: externo123')

      // Limpar transações antigas
      const deleted = await prisma.transaction.deleteMany({
        where: { userId: existingUser.id }
      })
      console.log(`🗑️  ${deleted.count} transações antigas removidas\n`)

      // Usar o usuário existente para gerar novas transações
      await generateTransactions(existingUser)
      return
    }

    // Criar usuário externo
    const hashedPassword = await bcrypt.hash('externo123', 10)

    const externalUser = await prisma.user.create({
      data: {
        email: 'externo@educasa.com',
        password: hashedPassword,
        name: 'Usuário Externo Teste',
        role: 'EXTERNAL'
      }
    })

    console.log('✅ Usuário externo criado com sucesso!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:', externalUser.email)
    console.log('🔑 Senha: externo123')
    console.log('👤 Role:', externalUser.role)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Gerar transações com categorias globais
    await generateTransactions(externalUser)

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function generateTransactions(user) {
  console.log('💰 Gerando transações financeiras...\n')

  // Buscar categorias globais
  const categories = await prisma.category.findMany({
    where: { type: 'EXPENSE' },
    include: {
      subcategories: true
    }
  })

  if (categories.length === 0) {
    console.error('❌ Nenhuma categoria encontrada! Execute o seed primeiro.')
    return
  }

  console.log(`✓ ${categories.length} categorias IPCA encontradas\n`)

  let totalTransactions = 0
  const transactionsPerMonth = {
    0: 50, // Mês atual
    1: 55, // Mês passado
    2: 48  // 2 meses atrás
  }

  // Gerar transações para os últimos 3 meses
  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const monthName = new Date(new Date().setMonth(new Date().getMonth() - monthsAgo))
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    console.log(`📅 Gerando transações para ${monthName}...`)

    const transactionsToCreate = transactionsPerMonth[monthsAgo]

    for (let i = 0; i < transactionsToCreate; i++) {
      // Selecionar categoria aleatória
      const category = randomItem(categories)

      // Selecionar subcategoria aleatória
      if (category.subcategories.length === 0) continue
      const subcategory = randomItem(category.subcategories)

      // Gerar dados da transação
      const amount = randomAmount(10, 500)
      const date = randomDate(monthsAgo)

      // Criar transação
      await prisma.transaction.create({
        data: {
          description: `${subcategory.name} - ${category.name}`,
          amount: amount,
          date: date,
          type: 'EXPENSE',
          userId: user.id,
          categoryId: category.id,
          subcategoryId: subcategory.id
        }
      })

      totalTransactions++
    }

    console.log(`  ✓ ${transactionsToCreate} transações criadas`)
  }

  console.log(`\n✅ ${totalTransactions} transações geradas com sucesso!`)
  console.log('\n📊 Você pode agora testar o dashboard financeiro!')
  console.log(`\n🔑 Credenciais de acesso:`)
  console.log(`   📧 Email: externo@educasa.com`)
  console.log(`   🔑 Senha: externo123\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
