#!/bin/sh
set -e

echo "🚀 Iniciando aplicação..."

# Verificar se está usando Turso Cloud
if echo "$DATABASE_URL" | grep -q "^libsql://"; then
  echo "🌐 Usando Turso Cloud - pulando verificação de arquivo local"

  # Gerar Prisma Client com driver adapters
  echo "🔧 Gerando Prisma Client..."
  npx prisma generate
else
  # SQLite local
  echo "📁 Usando SQLite local"

  # Criar diretório do banco de dados se não existir
  mkdir -p /app/prisma/database

  # Verificar se o banco de dados já existe
  if [ ! -f "/app/prisma/database/educasa_prod.db" ]; then
    echo "📦 Banco de dados não encontrado. Criando..."

    # Executar migrations
    echo "🔄 Executando migrations..."
    npx prisma migrate deploy

    # Executar seed
    echo "🌱 Executando seed..."
    npm run db:seed

    echo "✅ Banco de dados criado e populado com sucesso!"
  else
    echo "✅ Banco de dados já existe. Verificando migrations..."

    # Executar migrations pendentes
    npx prisma migrate deploy
  fi

  # Gerar Prisma Client (caso não exista)
  echo "🔧 Gerando Prisma Client..."
  npx prisma generate
fi

echo "🎉 Inicialização concluída! Iniciando servidor..."

# Iniciar aplicação
exec node .output/server/index.mjs
