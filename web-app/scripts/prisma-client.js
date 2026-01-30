import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

/**
 * Cria e retorna uma instância do PrismaClient configurada corretamente
 * para usar Turso Cloud (libsql) ou SQLite local
 */
export function createPrismaClient() {
    const databaseUrl = process.env.DATABASE_URL || ''
    const isTurso = databaseUrl.startsWith('libsql://')

    if (isTurso) {
        // Usar Turso Cloud
        const libsqlUrl = process.env.TURSO_DATABASE_URL || ''
        const authToken = process.env.TURSO_AUTH_TOKEN || ''

        const adapter = new PrismaLibSql({
            url: libsqlUrl,
            authToken: authToken,
        })

        return new PrismaClient({ adapter })
    } else {
        // SQLite local
        return new PrismaClient()
    }
}
