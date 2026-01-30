import bcrypt from 'bcrypt'
import { createPrismaClient } from './prisma-client.js'

const prisma = createPrismaClient()

async function main() {
  try {
    console.log('🎓 Criando estudante de teste...\n')

    // Verificar se já existe
    const existingStudent = await prisma.user.findFirst({
      where: { email: 'aluno@educasa.com' }
    })

    if (existingStudent) {
      console.log('⚠️  Estudante de teste já existe!')
      console.log('Email:', existingStudent.email)
      console.log('Role:', existingStudent.role)

      // Atualizar senha
      const hashedPassword = await bcrypt.hash('aluno123', 10)
      await prisma.user.update({
        where: { id: existingStudent.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Senha atualizada para: aluno123\n')
      return
    }

    // Buscar uma turma existente ou criar uma de teste
    let turma = await prisma.turma.findFirst()

    if (!turma) {
      console.log('📚 Criando turma de teste...')
      turma = await prisma.turma.create({
        data: {
          name: 'Turma Teste',
          description: 'Turma para testes de desenvolvimento'
        }
      })
      console.log('✓ Turma criada\n')
    }

    // Criar estudante
    const hashedPassword = await bcrypt.hash('aluno123', 10)

    const student = await prisma.user.create({
      data: {
        email: 'aluno@educasa.com',
        password: hashedPassword,
        name: 'Estudante Teste',
        role: 'STUDENT',
        turmaId: turma.id
      }
    })

    console.log('✅ Estudante criado com sucesso!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:', student.email)
    console.log('🔑 Senha: aluno123')
    console.log('👤 Role:', student.role)
    console.log('📚 Turma:', turma.name)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 As categorias IPCA já estão disponíveis globalmente!')
    console.log('   O estudante pode criar subcategorias personalizadas.\n')

  } catch (error) {
    console.error('❌ Erro:', error.message)
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
