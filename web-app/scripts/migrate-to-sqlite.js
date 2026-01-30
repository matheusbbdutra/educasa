#!/usr/bin/env node

/**
 * Script de migração para SQLite
 * 
 * Este script:
 * 1. Remove o banco de dados antigo
 * 2. Cria um novo banco SQLite
 * 3. Executa as migrations
 * 4. Executa o seed com categorias IPCA
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

const dbPath = path.join(projectRoot, 'database', 'educasa_dev.db')
const dbDir = path.dirname(dbPath)

console.log('🚀 Starting SQLite migration...\n')

// Criar diretório database se não existir
if (!fs.existsSync(dbDir)) {
    console.log('📁 Creating database directory...')
    fs.mkdirSync(dbDir, { recursive: true })
}

// Remover banco antigo se existir
if (fs.existsSync(dbPath)) {
    console.log('🗑️  Removing old database...')
    fs.unlinkSync(dbPath)
}

// Remover migrations antigas
const migrationsDir = path.join(projectRoot, 'prisma', 'migrations')
if (fs.existsSync(migrationsDir)) {
    console.log('🗑️  Removing old migrations...')
    fs.rmSync(migrationsDir, { recursive: true, force: true })
}

try {
    // Criar nova migration
    console.log('\n📦 Creating new migration...')
    execSync('npx prisma migrate dev --name init_sqlite', {
        cwd: projectRoot,
        stdio: 'inherit'
    })

    console.log('\n✅ Migration completed successfully!')
    console.log('✅ Seed data created successfully!')
    console.log('\n🎉 SQLite migration finished!\n')

    console.log('📊 You can now:')
    console.log('  - Run "npm run dev" to start the development server')
    console.log('  - Run "npm run db:studio" to view the database')

} catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
}
