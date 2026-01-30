import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function debug() {
  console.log('=== DEBUG CONEXÃO ===\n')

  console.log('1. DATABASE_URL:', process.env.DATABASE_URL)
  console.log('')

  try {
    console.log('2. Tentando conectar...')
    await prisma.$connect()
    console.log('✓ Conexão bem-sucedida!\n')

    console.log('3. Testando query...')
    const count = await prisma.user.count()
    console.log(`✓ Encontrados ${count} usuários\n`)

    console.log('4. Listando usuários:')
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    })
    console.table(users)

    if (count === 0) {
      console.log('\n⚠ Nenhum usuário encontrado!')
      console.log('Execute: node scripts/create-admin.js')
    }

  } catch (error) {
    console.error('✗ Erro:', error.message)
    console.error('\nDetalhes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debug()
