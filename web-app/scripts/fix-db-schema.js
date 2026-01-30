import { createPrismaClient } from './prisma-client.js'

const prisma = createPrismaClient()

async function main() {
    console.log('🔧 Aplicando correção manual no banco de dados...')

    try {
        // Tentar adicionar a coluna que falta
        // SQLite não suporta IF NOT EXISTS em ADD COLUMN, então se falhar é porque já existe ou erro

        // Adicionar autoExportConsent
        console.log('Adicionando coluna autoExportConsent em users...')
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE users ADD COLUMN autoExportConsent BOOLEAN DEFAULT 0;
      `)
            console.log('✅ Coluna autoExportConsent adicionada com sucesso!')
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('ℹ️ Coluna autoExportConsent já existe.')
            } else {
                throw e
            }
        }

        console.log('\n🎉 Correção concluída com sucesso!')

    } catch (error) {
        console.error('❌ Erro ao aplicar correção:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
