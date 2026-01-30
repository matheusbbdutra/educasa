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
        console.log('👨‍💻 Criando usuário desenvolvedor...\n')

        // AJUSTE SEU EMAIL AQUI
        const DEV_EMAIL = 'dev@educasa.com' // <-- MUDE AQUI
        const DEV_NAME = 'Desenvolvedor'
        const DEV_PASSWORD = 'dev123'

        // Verificar se já existe
        const existingDev = await prisma.user.findFirst({
            where: { email: DEV_EMAIL }
        })

        if (existingDev) {
            console.log('⚠️  Usuário desenvolvedor já existe!')
            console.log('Email:', existingDev.email)
            console.log('Role:', existingDev.role)

            // Atualizar senha
            const hashedPassword = await bcrypt.hash(DEV_PASSWORD, 10)
            await prisma.user.update({
                where: { id: existingDev.id },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN' // Garantir que é admin
                }
            })
            console.log('✓ Senha atualizada para:', DEV_PASSWORD)

            // Limpar transações antigas
            const deleted = await prisma.transaction.deleteMany({
                where: { userId: existingDev.id }
            })
            console.log(`🗑️  ${deleted.count} transações antigas removidas\n`)

            // Gerar novas transações
            await generateMockTransactions(existingDev)
            return
        }

        // Criar usuário desenvolvedor
        const hashedPassword = await bcrypt.hash(DEV_PASSWORD, 10)

        const devUser = await prisma.user.create({
            data: {
                email: DEV_EMAIL,
                password: hashedPassword,
                name: DEV_NAME,
                role: 'ADMIN' // Desenvolvedor com acesso admin
            }
        })

        console.log('✅ Usuário desenvolvedor criado com sucesso!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('👤 Nome:', devUser.name)
        console.log('📧 Email:', devUser.email)
        console.log('🔑 Senha:', DEV_PASSWORD)
        console.log('🔐 Role:', devUser.role)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

        // Gerar transações de mock
        await generateMockTransactions(devUser)

    } catch (error) {
        console.error('❌ Erro:', error.message)
        console.error(error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

async function generateMockTransactions(user) {
    console.log('💰 Gerando transações de mock para desenvolvimento...\n')

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
    let totalIncome = 0
    let totalExpenses = 0

    // Gerar receitas mensais (salário)
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
        const salaryDate = new Date()
        salaryDate.setMonth(salaryDate.getMonth() - monthsAgo)
        salaryDate.setDate(5) // Dia 5 de cada mês

        const salary = 5000 + randomAmount(-500, 500) // Salário variável

        await prisma.transaction.create({
            data: {
                description: 'Salário',
                amount: salary,
                date: salaryDate,
                type: 'INCOME',
                userId: user.id
            }
        })

        totalIncome += salary
        totalTransactions++
    }

    console.log('✓ Receitas mensais criadas')

    // Gerar despesas para os últimos 3 meses
    const transactionsPerMonth = {
        0: 60, // Mês atual
        1: 65, // Mês passado
        2: 58  // 2 meses atrás
    }

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

            // Gerar dados da transação com valores mais realistas
            let amount
            if (category.name === 'Habitação') {
                amount = randomAmount(500, 1500) // Aluguel, contas
            } else if (category.name === 'Alimentação e bebidas') {
                amount = randomAmount(20, 200)
            } else if (category.name === 'Transportes') {
                amount = randomAmount(30, 300)
            } else if (category.name === 'Saúde e cuidados pessoais') {
                amount = randomAmount(50, 400)
            } else {
                amount = randomAmount(15, 250)
            }

            const date = randomDate(monthsAgo)

            // Criar transação
            await prisma.transaction.create({
                data: {
                    description: `${subcategory.name}`,
                    amount: amount,
                    date: date,
                    type: 'EXPENSE',
                    userId: user.id,
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
    console.log('✅ Transações de mock geradas!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📊 Total de transações: ${totalTransactions}`)
    console.log(`💰 Total de receitas: R$ ${totalIncome.toFixed(2)}`)
    console.log(`💸 Total de despesas: R$ ${totalExpenses.toFixed(2)}`)
    console.log(`📈 Saldo: R$ ${balance.toFixed(2)}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🎉 Pronto para desenvolvimento!')
    console.log('   Faça login com as credenciais acima.\n')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
