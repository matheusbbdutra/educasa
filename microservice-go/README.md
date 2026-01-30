# Educa.SA Go Worker Service

Serviço Go para processamento assíncrono de operações bloqueantes (geração de CSV e envio de emails).

## Arquitetura

```
┌─────────────────┐      HTTP/REST      ┌──────────────────┐
│   Nuxt Frontend │ ←──────────────────→│  Node/Nuxt API   │
└─────────────────┘                      └──────────────────┘
                                                │
                                                │ HTTP/REST
                                                ↓
                                        ┌──────────────────┐
                                        │   Go Worker      │
                                        │   Service        │
                                        └──────────────────┘
                                                │
                                                ↓
                                        ┌──────────────────┐
                                        │     Turso DB     │
                                        └──────────────────┘
```

## Funcionalidades

- ✅ Geração assíncrona de CSVs com histórico financeiro
- ✅ Envio de emails em lotes via SMTP
- ✅ Processamento de jobs com retry automático
- ✅ Scheduler interno para exportações mensais (cron)
- ✅ API REST para enfileiramento e consulta de jobs
- ✅ Health check endpoint

## Estrutura do Projeto

```
microservice-go/
├── cmd/
│   └── worker/
│       └── main.go                 # Entry point
├── internal/
│   ├── config/
│   │   └── config.go              # Configuração
│   ├── database/
│   │   ├── turso.go               # Conexão Turso/SQLite
│   │   └── migrations.go          # Schema de jobs
│   ├── worker/
│   │   ├── csv_generator.go       # Geração de CSV
│   │   ├── email_sender.go        # Envio de emails
│   │   ├── job_processor.go       # Processamento de jobs
│   │   └── scheduler.go           # Cron/scheduler
│   ├── api/
│   │   ├── handlers.go            # HTTP handlers
│   │   ├── middleware.go          # Autenticação
│   │   └── router.go              # Rotas
│   └── models/
│       ├── job.go                 # Model de Job
│       └── export.go              # Model de Export
├── Dockerfile
├── .env.example
└── README.md
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/jobs/enqueue` | Enfileira novo job |
| GET | `/api/v1/jobs/:id/status` | Status de job específico |
| GET | `/api/v1/jobs/queue` | Lista jobs na fila |
| GET | `/api/v1/health` | Health check |

### Exemplo: Enfileirar Job

```bash
curl -X POST http://localhost:8080/api/v1/jobs/enqueue \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "type": "MONTHLY_AUTO",
    "priority": 1,
    "payload": {
      "turma_name": "Turma A",
      "user_ids": ["user1", "user2"],
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-01-31T23:59:59Z",
      "to_email": "admin@school.com"
    }
  }'
```

## Desenvolvimento Local

### Pré-requisitos

- Go 1.21+
- Docker (opcional)
- Turso Database ou SQLite local

### Configuração

1. Copiar `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configurar variáveis de ambiente:
```bash
# Turso Cloud (recomendado)
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# OU SQLite local
DATABASE_URL="file:/data/database/educasa_dev.db"

# SMTP (Zeptomail)
SMTP_HOST="smtp.zeptomail.com"
SMTP_PORT="587"
SMTP_USERNAME="emailapikey"
SMTP_PASSWORD="your-zeptomail-token"
SMTP_FROM_EMAIL="noreply@educasa.app.br"
SMTP_FROM_NAME="Educa.SA"

# API Security
GO_WORKER_API_KEY="change-this-in-production"
```

### Rodar Localmente

```bash
# Instalar dependências
go mod download

# Rodar
go run cmd/worker/main.go
```

### Rodar com Docker

```bash
# Build
docker build -t educasa-go-worker .

# Run
docker run -p 8080:8080 --env-file .env educasa-go-worker
```

## Deploy em Produção

### Docker Compose

O serviço está integrado no `docker-compose.yml` principal:

```bash
cd /path/to/educasa/web-app
docker-compose up -d
```

### Variáveis de Ambiente de Produção

```bash
# Turso Cloud
TURSO_DATABASE_URL="libsql://educasa-prod.turso.io"
TURSO_AUTH_TOKEN="your-production-token"

# SMTP (Zeptomail)
SMTP_HOST="smtp.zeptomail.com"
SMTP_PORT="587"
SMTP_USERNAME="emailapikey"
SMTP_PASSWORD="your-zeptomail-token"
SMTP_FROM_EMAIL="sistema@educasa.app.br"

# API Security
GO_WORKER_API_KEY="random-secure-key"
```

## Schema do Banco de Dados

O serviço cria automaticamente as tabelas:

### `export_jobs`
- Armazena jobs de exportação
- Status: PENDING, PROCESSING, COMPLETED, FAILED
- Suporte a retry automático

### `export_batches`
- Armazena batches de exportação
- Relacionado com `export_jobs`

## Monitoramento

### Health Check

```bash
curl http://localhost:8080/api/v1/health
```

Resposta:
```json
{
  "status": "healthy",
  "database": "connected",
  "queue_size": 0,
  "worker_status": "running",
  "timestamp": "2025-01-28T20:00:00Z"
}
```

### Logs

O serviço usa logging estruturado (JSON por padrão):

```json
{
  "level": "info",
  "msg": "Processing job job_123",
  "job_id": "job_123",
  "type": "MONTHLY_AUTO"
}
```

## Troubleshooting

### Erro: "failed to open db"

- Verificar `TURSO_DATABASE_URL`
- Validar `TURSO_AUTH_TOKEN`

### Erro: "API key required"

- Configurar `GO_WORKER_API_KEY`
- Incluir header `X-API-Key` nas requisições

### Jobs não processando

- Verificar health check
- Checar logs do worker
- Validar conexão com banco

## Integração com Nuxt

O serviço expõe um client TypeScript em `web-app/server/utils/go-worker-client.ts`:

```typescript
import { enqueueGoWorkerJob } from '@/server/utils/go-worker-client'

const jobId = await enqueueGoWorkerJob({
  type: 'MONTHLY_AUTO',
  priority: 1,
  payload: {
    user_ids: ['user1', 'user2'],
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    to_email: 'admin@school.com'
  }
})
```

## Cron/Scheduler

O scheduler interno roda exportações mensais automaticamente:

```bash
# Configurar cron (dia 1 às 00:00)
MONTHLY_CRON="0 0 1 * *"
ENABLE_SCHEDULER="true"
```

O scheduler busca alunos com `autoExportConsent: true` e enfileira jobs automaticamente.

## Performance

### Benchmarks (estimados)

- **100 alunos**: ~5-10 segundos (não bloqueante)
- **500 alunos**: ~20-30 segundos (distribuído)
- **Concorrência**: Até 3 jobs simultâneos

### Escalabilidade

```bash
# Escalar horizontalmente
docker-compose up -d --scale go-worker=3
```

## Segurança

- API Key compartilhada entre Nuxt e Go Worker
- Apenas comunicação interna via Docker network
- Health check público (sem autenticação)
- Logs sem dados sensíveis

## Licença

MIT

## Suporte

Para dúvidas ou problemas, abrir issue no repositório do Educa.SA.
