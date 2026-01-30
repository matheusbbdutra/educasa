FROM node:24-alpine AS base

# Dependências de build
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN apk add --no-cache openssl ca-certificates
RUN npm ci

# Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Build do Nuxt
RUN npm run build

# Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cria diretório para o banco de dados e ajusta permissões
RUN mkdir -p /app/prisma/database && \
    chown -R node:node /app

# Copia apenas os arquivos necessários
COPY --from=builder --chown=node:node /app/.output ./.output
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/docker-entrypoint.sh ./

# Torna o script executável
RUN chmod +x /app/docker-entrypoint.sh

# Muda para usuário não-privilegiado
USER node

EXPOSE 3000

# Usa o script de inicialização
ENTRYPOINT ["/app/docker-entrypoint.sh"]
