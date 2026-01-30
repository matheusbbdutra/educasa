import bcrypt from 'bcrypt'
import * as readline from 'readline'
import { createPrismaClient } from './prisma-client.js'

const prisma = createPrismaClient()

// Criar interface para leitura de input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// Função para fazer perguntas
function question(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve)
    })
}

async function main() {
    try {
        console.log('👤 Criação de Administrador\n')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

        // Coletar informações
        const name = await question('Nome completo: ')
        const email = await question('Email: ')
        const password = await question('Senha: ')

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

        // Verificar se já existe
        const existingAdmin = await prisma.user.findFirst({
            where: { email: email }
        })

        if (existingAdmin) {
            console.log('⚠️  Usuário com este email já existe!')
            console.log('Email:', existingAdmin.email)
            console.log('Role:', existingAdmin.role)

            const update = await question('\nDeseja atualizar a senha? (s/n): ')

            if (update.toLowerCase() === 's') {
                const hashedPassword = await bcrypt.hash(password, 10)
                await prisma.user.update({
                    where: { id: existingAdmin.id },
                    data: {
                        password: hashedPassword,
                        name: name,
                        role: 'ADMIN'
                    }
                })
                console.log('\n✅ Usuário atualizado com sucesso!')
            }

            rl.close()
            return
        }

        // Criar admin
        const hashedPassword = await bcrypt.hash(password, 10)

        const admin = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                name: name,
                role: 'ADMIN'
            }
        })

        console.log('✅ Administrador criado com sucesso!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('👤 Nome:', admin.name)
        console.log('📧 Email:', admin.email)
        console.log('🔐 Role:', admin.role)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    } catch (error) {
        console.error('\n❌ Erro:', error.message)
        throw error
    } finally {
        rl.close()
        await prisma.$disconnect()
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
