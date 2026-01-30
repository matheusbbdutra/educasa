# 💰 Educa.SA - Educação Financeira na Sala de Ações

O **Educa.SA** (Educação Financeira na Sala de Ações) é uma plataforma de gestão financeira projetada para o ambiente educacional. O objetivo é oferecer a estudantes uma ferramenta prática para aprender sobre finanças pessoais, enquanto administradores de instituições de ensino podem gerenciar turmas e alunos de forma simplificada.

Construído com tecnologias modernas, o projeto serve como um case de estudo completo para desenvolvimento full-stack com Nuxt 3, Prisma e PostgreSQL.

## ✨ Funcionalidades

### 👨‍💼 Módulo Administrador

- **Dashboard Intuitivo:** Visão geral de turmas e alunos cadastrados com cards informativos.
- **Gestão de Turmas:** CRUD completo com filtros por nome e visualização de alunos vinculados.
- **Gestão de Alunos:** Adicione, edite e remova alunos com filtros avançados (nome, email, turma).
- **Provisionamento Automático:** Cada novo aluno recebe automaticamente categorias padrão de despesas (com dezenas de subcategorias) para começar a usar o sistema imediatamente.
- **Configurações de Perfil:** Atualize suas informações e senha com segurança.

### 🎓 Módulo Aluno

- **Dashboard Financeiro Completo:**
  - Resumo mensal de despesas e indicadores de desempenho
  - **Gráfico de Pizza:** Distribuição de despesas por categoria
  - **Gráfico de Linha:** Evolução financeira dos últimos 6 meses
  - Lista das 10 transações mais recentes
- **Gestão de Transações:**
  - Interface moderna com modal interativo
  - Filtros por categoria e descrição
  - Input monetário com formatação automática (R$)
  - Seleção de data, hora e subcategoria
- **Categorização Flexível:**
  - Interface dividida em duas colunas (Categorias | Subcategorias)
  - Gerencie categorias e subcategorias personalizadas
  - Validação de nomes únicos
- **Configurações de Perfil:** Atualize suas informações, senha e visualize sua turma vinculada.

## 🛠️ Tecnologias Utilizadas

### Backend

- **Framework Full-Stack:** [Nuxt 4](https://nuxt.com/) (Vue 3 + TypeScript)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/) v6.1.0
- **Autenticação:** JWT com `bcrypt` (tokens com 7 dias de validade)
- **Servidor:** H3 / Nitro (Node.js preset)

### Frontend

- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) v6.12.2
- **Ícones:** [Nuxt Icon](https://github.com/nuxt-modules/icon) v1.9.3 (Material Design Icons)
- **Gráficos:** [Chart.js](https://www.chartjs.org/) v4.4.7 + [vue-chartjs](https://vue-chartjs.org/) v5.3.2
- **Validação de Dados:** [Zod](https://zod.dev/) v3.24.1
- **Fonte:** Inter (Google Fonts)

### DevOps

- **Containerização:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Reverse Proxy:** Configurado para [Traefik](https://traefik.io/) (produção)

## 🚀 Configuração e Instalação (Desenvolvimento)

Siga os passos abaixo para configurar o ambiente de desenvolvimento local.

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- npm (ou yarn / pnpm)

### 1. Clonar o Repositório
```bash
git clone <seu-repositorio>
cd educasa
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` a partir do exemplo. Este arquivo guardará as credenciais do banco de dados e o segredo JWT.

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as configurações para o seu ambiente de **desenvolvimento**:
```env
# URL de conexão para o banco de dados Docker local
DATABASE_URL="postgresql://educasa_user:educasa_password_123@localhost:5432/educasa_db"

# Chave secreta para assinar os tokens JWT
JWT_SECRET="super-secret-key-for-dev"

# Define o ambiente do Node.js
NODE_ENV="development"
```
> **IMPORTANTE:** Nunca use segredos de desenvolvimento em produção!

### 3. Instalar Dependências
```bash
npm install
```

### 4. Iniciar o Banco de Dados com Docker
Este comando irá iniciar um container com o PostgreSQL e um com o PgAdmin para gerenciamento.

```bash
docker-compose up -d postgres pgadmin
```
Aguarde alguns segundos para o banco de dados inicializar completamente.

### 5. Aplicar Migrations e Seed
Estes comandos preparam o banco de dados, criando as tabelas e populando com dados iniciais (como o usuário admin).

```bash
# 1. Aplica as migrações do Prisma para criar a estrutura do banco
npx prisma migrate dev

# 2. Popula o banco com o usuário admin padrão
npm run db:seed
```

### 6. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.

### Credenciais Padrão (Desenvolvimento)
- **Email:** `admin@educasa.com`
- **Senha:** `admin123`

## 🐳 Produção com Docker e Traefik

O `docker-compose.yml` na raiz do projeto é otimizado para produção e foi projetado para funcionar com um reverse proxy como o [Traefik](https://traefik.io/traefik/).

### Configuração
1.  **Banco de Dados Externo:** Este setup assume que você possui uma instância do PostgreSQL rodando externamente (ex: RDS, DigitalOcean Managed Database, etc.).
2.  **Arquivo `.env`:** Certifique-se de que o arquivo `.env` no servidor de produção contém as variáveis corretas:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/database"
    JWT_SECRET="gere-uma-chave-forte-e-segura-para-producao"
    NODE_ENV="production"
    ```
3.  **Rede do Traefik:** O serviço `app` está configurado para usar uma rede externa chamada `traefik_default`. Certifique-se de que esta rede existe no seu ambiente Docker.
4.  **Domínio:** O arquivo `docker-compose.yml` está configurado para o host `educasa.mdutra.dev`. **Você deve alterar este valor** para o seu próprio domínio.
    ```yaml
    # docker-compose.yml
    labels:
      - "traefik.http.routers.educasa-router.rule=Host(`seu-dominio.com`)"
    ```

### Build e Deploy
Com o Traefik e a rede `traefik_default` configurados, execute o seguinte comando para fazer o build da imagem e iniciar o container:

```bash
docker-compose up -d --build
```

Para visualizar os logs da aplicação:
```bash
docker-compose logs -f app
```

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera a build de produção da aplicação.
- `npm run db:migrate`: Aplica as migrações do banco de dados.
- `npm run db:seed`: Popula o banco com dados iniciais.
- `npm run db:studio`: Abre o Prisma Studio, uma GUI para interagir com o banco.

## Troubleshooting

- **Erro de Conexão com Banco:** Verifique se o container do `postgres` está rodando (`docker ps`) e se a `DATABASE_URL` no `.env` está correta.
- **Erro "Prisma Client não encontrado":** Execute `npx prisma generate` para gerar o cliente do Prisma.
- **Resetar Banco de Dados (Dev):** `npx prisma migrate reset` (cuidado, isso apaga todos os dados).

## 🗺️ Roadmap

- [x] Implementar gráficos com Chart.js
- [x] Adicionar página de transações completa
- [ ] Implementar exportação de dados (CSV/Excel)
- [ ] Adicionar relatórios detalhados para admin
- [ ] Implementar filtros avançados de data (intervalos personalizados)
- [ ] Adicionar testes automatizados (Vitest + Testing Library)
- [ ] Implementar dark mode
- [ ] Transformar em PWA (Progressive Web App)
- [ ] Adicionar notificações push
- [ ] Implementar importação de extratos bancários (OFX/CSV)
- [ ] Adicionar metas financeiras e orçamentos
- [ ] Implementar paginação em tabelas longas

## 📄 Licença

Este projeto é para fins educacionais e está sob a licença MIT.
