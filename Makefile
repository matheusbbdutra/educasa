.PHONY: help build up down restart logs clean shell install test dev prod
.PHONY: db-migrate db-migrate-create db-migrate-turso db-migrate-status

# Variáveis
COMPOSE_DEV=docker-compose -f docker-compose.dev.yml
COMPOSE_PROD=docker-compose
COMPOSE_PROD_LEGACY=docker-compose -f docker-compose.prod.yml
APP_SERVICE=app
GO_WORKER_SERVICE=go-worker
TURSO_DB_NAME=educasa-dev

# Configurações
NODE_ENV ?= development

help: ## Mostra comandos disponíveis
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  setup         - Configuração inicial (cria links de .env)"
	@echo "  make link-env - Cria links simbólicos dos .env"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make build       - Build das imagens Docker"
	@echo "  make up          - Sobe os containers (dev)"
	@echo "  make down        - Para e remove containers"
	@echo "  make restart     - Reinicia containers"
	@echo "  make logs        - Mostra logs dos containers"
	@echo "  make shell       - Abre shell no container app"
	@echo "  make shell-go    - Abre shell no container go-worker"
	@echo "  make clean       - Remove containers e volumes"
	@echo "  make rebuild     - Rebuild e restart"
	@echo ""
	@echo "💻 Desenvolvimento local:"
	@echo "  make dev         - Sobe ambiente de desenvolvimento"
	@echo "  make prod        - Sobe ambiente de produção"
	@echo "  make install     - Instala dependências"
	@echo "  make test        - Roda testes"
	@echo ""
	@echo "🗄️  Database / Migrations:"
	@echo "  make db-migrate-create NOME=nome      - Cria nova migration (Prisma)"
	@echo "  make db-migrate-turso                  - Aplica migrations PENDENTES no Turso"
	@echo "  make db-migrate-apply FILE=path       - Aplica arquivo SQL específico no Turso"
	@echo "  make db-migrate-status                - Lista migrations aplicadas vs pendentes"
	@echo "  make db-seed                          - Semeia dados de desenvolvimento"
	@echo "  make db-shell-turso                   - Abre shell SQL no Turso Cloud"

# ============================================================================
# SETUP (links simbólicos)
# ============================================================================

link-env: ## Cria links simbólicos dos arquivos .env
	@echo "🔗 Criando links simbólicos dos arquivos .env..."
	@if [ ! -f .env ]; then \
		echo "❌ Erro: .env não encontrado na raiz do projeto"; \
		exit 1; \
	fi
	@ln -sf ../.env web-app/.env 2>/dev/null || true
	@ln -sf ../.env microservice-go/.env 2>/dev/null || true
	@echo "✅ Links criados:"
	@echo "   web-app/.env → ../.env"
	@echo "   microservice-go/.env → ../.env"

setup: ## Configuração inicial do projeto
	@echo "🔧 Configurando ambiente..."
	@echo ""
	@echo "📁 Criando estrutura de diretórios..."
	@mkdir -p web-app/prisma/database
	@mkdir -p microservice-go/tmp
	@echo "✅ Diretórios criados"
	@echo ""
	@make link-env
	@echo ""
	@echo "📦 Instalando dependências..."
	@cd web-app && npm install
	@cd microservice-go && go mod download
	@echo ""
	@echo "✅ Setup completo!"
	@echo ""
	@echo "🚀 Próximos passos:"
	@echo "   make dev    - Ambiente de desenvolvimento"
	@echo "   make prod   - Ambiente de produção"

# ============================================================================
# DOCKER
# ============================================================================

build: ## Build das imagens Docker
	docker-compose build

up: ## Sobe containers (desenvolvimento)
	$(COMPOSE_DEV) up -d
	@echo "✅ Serviços subidos!"
	@echo "🌐 App: http://localhost:3000"
	@echo "⚙️  Go Worker: http://localhost:8080"
	@echo "💡 Logs: make logs"

down: ## Para e remove containers
	$(COMPOSE_DEV) down

restart: ## Reinicia containers
	$(COMPOSE_DEV) restart

logs: ## Mostra logs dos containers
	$(COMPOSE_DEV) logs -f

logs-app: ## Logs apenas do app
	$(COMPOSE_DEV) logs -f app

logs-go: ## Logs apenas do go-worker
	$(COMPOSE_DEV) logs -f go-worker

shell: ## Abre shell no container app
	$(COMPOSE_DEV) exec $(APP_SERVICE) /bin/bash

shell-go: ## Abre shell no container go-worker
	$(COMPOSE_DEV) exec $(GO_WORKER_SERVICE) /bin/bash

clean: ## Remove containers e volumes
	$(COMPOSE_DEV) down -v
	docker system prune -f

install: ## Instala dependências do Nuxt
	cd web-app && npm install

test: ## Roda testes
	cd web-app && npm test

dev: ## Ambiente de desenvolvimento completo
	$(COMPOSE_DEV) up -d
	@echo "✅ Ambiente de desenvolvimento rodando!"
	@echo "🌐 Nuxt: http://localhost:3000"
	@echo "⚙️  Go Worker: http://localhost:8080"
	@echo ""
	@echo "💡 Comandos úteis:"
	@echo "   make logs       - Ver logs"
	@echo "   make shell      - Entrar no container"
	@echo "   make restart    - Reiniciar serviços"
	@echo "   make down       - Parar serviços"

dev-local: ## Sobe Nuxt localmente (sem Docker)
	@echo "🧹 Limpando .nuxt..."
	@cd web-app && rm -rf .nuxt
	@echo "🚀 Subindo Nuxt em modo dev..."
	@cd web-app && npm run dev

prod: ## Ambiente de produção
	$(COMPOSE_PROD) up -d
	@echo "✅ Ambiente de produção rodando!"

prod-build: ## Build para produção
	cd web-app && npm run build

prod-restart: ## Reinicia produção
	$(COMPOSE_PROD) restart

rebuild: ## Rebuild e restart (útil durante desenvolvimento)
	@echo "🔨 Rebuildando..."
	docker-compose build
	@echo "♻️  Reiniciando..."
	$(COMPOSE_DEV) up -d --force-recreate

update: ## Atualiza dependências
	cd web-app && npm update

# ============================================================================
# DATABASE MIGRATIONS (TURSO + PRISMA)
# ============================================================================

db-migrate-create: ## Cria nova migration Prisma (uso: make db-migrate-create NOME=nome_migration)
	@if [ -z "$(NOME)" ]; then \
		echo "❌ Erro: especifique o nome da migration"; \
		echo "   Uso: make db-migrate-create NOME=add_users_table"; \
		exit 1; \
	fi
	@echo "📝 Criando migration: $(NOME)"
	cd web-app && npx prisma migrate dev --name $(NOME) --create-only
	@echo "✅ Migration criada em: web-app/prisma/migrations/"
	@echo ""
	@echo "📋 Próximos passos:"
	@echo "   1. Revise o SQL gerado em web-app/prisma/migrations/"
	@echo "   2. Aplique no Turso: make db-migrate-turso"

db-migrate-turso: ## Aplica migrations PENDENTES no Turso Cloud
	@echo "🔄 Verificando migrations pendentes..."
	@echo ""
	@for migration in web-app/prisma/migrations/*/migration.sql; do \
		if [ -f "$$migration" ]; then \
			migration_name=$$(basename $$(dirname "$$migration")); \
			echo "📦 Aplicando $$migration_name..."; \
			turso db shell $(TURSO_DB_NAME) < "$$migration" && echo "✅ $$migration_name aplicada!" || echo "❌ Falha ao aplicar $$migration_name"; \
		fi \
	done
	@echo ""
	@echo "✅ Migrations aplicadas no Turso Cloud!"

db-migrate-apply: ## Aplica arquivo SQL específico no Turso (uso: make db-migrate-apply FILE=path/to/file.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Erro: especifique o arquivo SQL"; \
		echo "   Uso: make db-migrate-apply FILE=web-app/prisma/migrations/20250101_init/migration.sql"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "❌ Erro: arquivo não encontrado: $(FILE)"; \
		exit 1; \
	fi
	@echo "📦 Aplicando $(FILE) no Turso..."
	turso db shell $(TURSO_DB_NAME) < $(FILE)
	@echo "✅ Migration aplicada!"

db-migrate-status: ## Mostra status das migrations
	@echo "📊 Migrations Prisma:"
	@ls -1 web-app/prisma/migrations/*/migration.sql 2>/dev/null | while read migration; do \
		migration_name=$$(basename $$(dirname "$$migration")); \
		echo "   - $$migration_name"; \
	done
	@echo ""
	@echo "💡 Para aplicar migrations pendentes: make db-migrate-turso"
	@echo "💡 Para abrir shell do Turso: make db-shell-turso"

db-seed: ## Semeia dados de desenvolvimento
	cd web-app && npx prisma db seed

db-shell-turso: ## Abre shell SQL direto no Turso Cloud
	@echo "🔌 Conectando ao Turso Cloud: $(TURSO_DB_NAME)"
	@echo "💡 Comandos úteis:"
	@echo "   .tables     - Lista tabelas"
	@echo "   .schema    - Mostra schema"
	@echo "   SELECT * FROM users;  - Exemplo de query"
	@echo "   .quit       - Sair"
	@echo ""
	turso db shell $(TURSO_DB_NAME)

db-dump: ## Dump do schema do Turso
	@echo "📋 Schema do Turso Cloud:"
	turso db shell $(TURSO_DB_NAME) ".schema"

deps: ## Instala dependências Go
	cd microservice-go && go mod download

go-build: ## Compila Go worker localmente
	cd microservice-go && go build -o worker ./cmd/worker

health: ## Verifica saúde dos serviços
	@echo "🏥 Health checks:"
	@echo "   Nuxt:"
	@curl -s http://localhost:3000 || echo "   ❌ Nuxt não respondendo"
	@echo "   Go Worker:"
	@curl -s http://localhost:8080/api/v1/health | jq '.' || echo "   ❌ Go Worker não respondendo"

go-worker: ## Roda apenas Go worker localmente
	cd microservice-go && go run cmd/worker/main.go

fmt: ## Formata código Go
	cd microservice-go && go fmt ./...

fmt-check: ## Verifica formatação Go
	cd microservice-go && go fmt ./...

vet: ## Roda go vet
	cd microservice-go && go vet ./...

watch-dev: ## Watch mode para desenvolvimento (hot reload)
	@echo "👀️ Modo watch ativo (auto-reload)"
	$(COMPOSE_DEV) up
	cd web-app && npm run dev

.DEFAULT_GOAL := help
