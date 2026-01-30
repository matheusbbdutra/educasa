import bcrypt from 'bcrypt'
import { createPrismaClient } from './prisma-client.js'

const prisma = createPrismaClient()

async function main() {
  try {
    console.log('Conectando ao banco de dados...')

    // Testar conexão
    await prisma.$connect()
    console.log('✓ Conexão bem-sucedida!')

    // Verificar se admin já existe
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@educasa.com' }
    })

    if (existingAdmin) {
      console.log('⚠ Admin já existe!')
      console.log('Email:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)

      // Atualizar senha para garantir que é admin123
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Senha atualizada para: admin123')
      return
    }

    // Criar admin
    console.log('Criando usuário admin...')
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.create({
      data: {
        email: 'admin@educasa.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN'
      }
    })

    console.log('✓ Admin criado com sucesso!')
    console.log('Email:', admin.email)
    console.log('Senha: admin123')
    console.log('Role:', admin.role)

  } catch (error) {
    console.error('✗ Erro:', error.message)
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
