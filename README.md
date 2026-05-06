# FlowDesk

Plataforma SaaS full-stack de gestão de equipes e projetos — workspaces, Kanban com drag-and-drop, dashboard com métricas e colaboração em tempo real. Inspirado em Linear, Notion, Trello e Jira.

> Projeto de portfólio criado para demonstrar engenharia full-stack de nível profissional: arquitetura em camadas, JWT com rotação de refresh tokens, RBAC granular, WebSockets, drag-and-drop persistido e UI moderna.

---

## Stack

**Front-end** — Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS · TanStack Query · Zustand · React Hook Form · Zod · @dnd-kit · Recharts · Socket.io-client · lucide-react

**Back-end** — Node.js · Express · TypeScript · Prisma · PostgreSQL · Socket.io · JWT (access + refresh) · bcrypt · Zod

**Infra** — Vercel (front + back serverless) · Neon (PostgreSQL) · schema dedicado `flowdesk` (multi-projeto)

---

## Funcionalidades

### Autenticação
- Cadastro, login, logout, refresh token automático
- **JWT access (15min) + refresh (7d) com rotação**
- `tokenVersion` no banco invalida todos os refresh tokens em logout
- Persistência de sessão entre reloads
- Proteção de rotas no front e no back

### Workspaces
- Criar, editar, listar workspaces
- Convidar membros por email com papel (admin / manager / member)
- Remover membros (apenas owner/admin)
- 3 níveis de papel: `owner`, `admin`, `manager`, `member`

### Projetos
- CRUD de projetos vinculados a workspaces
- Status (active / paused / archived)
- Prazo opcional
- Cada projeto nasce com 4 colunas Kanban padrão: Backlog → Em andamento → Revisão → Concluído

### Kanban (drag-and-drop)
- **@dnd-kit** com sortable + droppable
- Reordenar tarefas dentro da mesma coluna
- Mover tarefas entre colunas
- Posições recalculadas e persistidas via transação Prisma
- Visual feedback durante drag (opacity + ring)

### Tarefas
- Título, descrição, prioridade (low/medium/high/urgent), prazo, responsável
- Comentários em tempo real (Socket.io)
- Modal de detalhes com edição inline
- Atribuir/desatribuir membros
- Notificação automática quando atribuído

### Tempo real (Socket.io)
- Eventos: `task:created`, `task:updated`, `task:deleted`, `task:moved`, `comment:new`, `notification:new`
- Rooms por projeto (`project:<id>`) e por usuário (`user:<id>`)
- **Fallback gracioso:** se Socket.io não conectar (serverless), polling de 60s mantém UX
- Autenticação via JWT no handshake

### Notificações
- Tipos: `task_assigned`, `comment`, `workspace_invite`, `task_moved`
- Dropdown na navbar com badge de não lidas
- Marcar como lida individual ou em lote
- Cache invalidation ao receber via socket

### Dashboard
- 6 cards de métricas (total/concluídas/atrasadas/atribuídas/projetos/workspaces)
- **Gráfico de produtividade semanal** (Recharts AreaChart)
- Lista de projetos ativos com prazos
- Feed de atividade recente (últimas 6 tarefas atualizadas)

### Tema
- Light / dark mode
- Detecção automática da preferência do sistema
- Persistência em localStorage

### Responsivo
- Desktop, tablet e mobile
- Sidebar oculta em mobile (navbar tem branding)
- Kanban com scroll horizontal em telas pequenas

---

## Arquitetura

### Backend
```
server/
├── prisma/
│   └── schema.prisma           Schema dedicado "flowdesk" (multiSchema)
├── src/
│   ├── config/                 env validation, Prisma cache
│   ├── lib/                    JWT helpers, Prisma client, Socket.io
│   ├── middleware/             auth, requireRole, errorHandler
│   ├── schemas/                Zod schemas (10+ validations)
│   ├── controllers/            8 controllers (auth, workspaces, projects,
│   │                           columns, tasks, comments, notifications, dashboard)
│   ├── routes/                 Centralized router
│   ├── utils/                  seed (3 users + 2 workspaces + 3 projects + tasks)
│   ├── app.ts                  Express factory
│   └── index.ts                HTTP server + Socket.io bootstrap
├── api/
│   └── index.ts                Vercel serverless adapter
└── vercel.json
```

### Frontend
```
client/
└── src/
    ├── app/
    │   ├── (auth)/             Login, Register
    │   ├── (app)/              Dashboard, Workspaces, Projects, Profile, Settings
    │   ├── layout.tsx          Root layout with providers
    │   ├── globals.css
    │   └── page.tsx            Landing page
    ├── components/
    │   ├── ui/                 Button, Input, Modal, Avatar, Toast, Spinner, EmptyState
    │   ├── layout/             Sidebar, Navbar
    │   ├── kanban/             KanbanColumn, TaskCard, TaskDetailModal
    │   ├── dashboard/          DashboardCharts (Recharts)
    │   └── notifications/      NotificationDropdown
    ├── store/                  authStore + themeStore (Zustand)
    ├── services/               api.ts (fetch with refresh) + endpoints.ts
    ├── hooks/                  useToast, useSocket
    ├── providers/              QueryClient + theme/auth bootstrap
    ├── types/                  Shared types
    └── utils/                  cn, formatters, avatarColor
```

---

## API REST

Todas as rotas em `/api/*` (exceto `health`, `register`, `login`, `refresh`) exigem `Authorization: Bearer <accessToken>`.

| Método | Endpoint                                       | Descrição                                        |
| ------ | ---------------------------------------------- | ------------------------------------------------ |
| POST   | `/api/auth/register`                           | Cadastro                                         |
| POST   | `/api/auth/login`                              | Login                                            |
| POST   | `/api/auth/refresh`                            | Renovar access token (rotação)                   |
| GET    | `/api/auth/me`                                 | Usuário atual                                    |
| POST   | `/api/auth/logout`                             | Invalida todos os refresh tokens                 |
| GET    | `/api/workspaces`                              | Lista workspaces do usuário                      |
| POST   | `/api/workspaces`                              | Cria workspace                                   |
| GET    | `/api/workspaces/:id`                          | Detalhe (membros + projetos)                     |
| POST   | `/api/workspaces/:id/invite`                   | Convidar membro                                  |
| DELETE | `/api/workspaces/:id/member/:memberId`         | Remover membro                                   |
| GET    | `/api/projects/:workspaceId`                   | Lista projetos do workspace                      |
| GET    | `/api/projects/single/:id`                     | Detalhe do projeto (com colunas e tarefas)       |
| POST   | `/api/projects`                                | Criar projeto (cria 4 colunas padrão)            |
| PUT    | `/api/projects/:id`                            | Atualizar                                        |
| DELETE | `/api/projects/:id`                            | Excluir                                          |
| POST   | `/api/columns`                                 | Criar coluna                                     |
| PUT    | `/api/columns/:id`                             | Atualizar (renomear/reordenar)                   |
| DELETE | `/api/columns/:id`                             | Excluir                                          |
| GET    | `/api/tasks/:projectId`                        | Lista tarefas agrupadas por coluna               |
| POST   | `/api/tasks`                                   | Criar tarefa                                     |
| PUT    | `/api/tasks/:id`                               | Atualizar                                        |
| DELETE | `/api/tasks/:id`                               | Excluir                                          |
| PATCH  | `/api/tasks/:id/move`                          | Mover entre colunas (recalcula posições)         |
| POST   | `/api/comments`                                | Criar comentário                                 |
| GET    | `/api/comments/:taskId`                        | Lista comentários                                |
| GET    | `/api/notifications`                           | Lista notificações + contagem unread             |
| PATCH  | `/api/notifications/:id/read`                  | Marcar uma como lida                             |
| PATCH  | `/api/notifications/read-all`                  | Marcar todas como lidas                          |
| GET    | `/api/dashboard/overview`                      | Stats + produtividade + atividade recente        |

---

## Como rodar local

### Pré-requisitos
- Node.js 20+
- PostgreSQL — recomendado **Neon** (free tier, instant)

### 1. Clonar e instalar
```bash
git clone https://github.com/Lucas-Fermau/flowdesk.git
cd flowdesk
cd server && npm install
cd ../client && npm install
```

### 2. Variáveis de ambiente
```bash
# Back-end
cp server/.env.example server/.env
# Gere DUAS chaves JWT:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Cole em JWT_ACCESS_SECRET e JWT_REFRESH_SECRET

# Front-end
cp client/.env.example client/.env
```

### 3. Migrations + seed
```bash
cd server
npx prisma db push
npm run seed
```

Isso cria:
- 3 usuários de teste (admin, manager, member — todos senha `123456`)
- 2 workspaces (Acme Studio, Side Projects)
- 3 projetos com 4 colunas padrão cada
- ~10 tarefas com prioridades variadas
- Comentários e notificações de exemplo

### 4. Rodar
Em **dois terminais**:
```bash
# terminal 1 — back
cd server && npm run dev          # http://localhost:4000

# terminal 2 — front
cd client && npm run dev          # http://localhost:3000
```

---

## Variáveis de ambiente

### `server/.env`
| Variável                  | Descrição                                          |
| ------------------------- | -------------------------------------------------- |
| `DATABASE_URL`            | Connection string PostgreSQL                       |
| `JWT_ACCESS_SECRET`       | Chave para access tokens (≥32 chars)               |
| `JWT_REFRESH_SECRET`      | Chave para refresh tokens (≥32 chars)              |
| `JWT_ACCESS_EXPIRES_IN`   | Expiração do access token (padrão `15m`)           |
| `JWT_REFRESH_EXPIRES_IN`  | Expiração do refresh token (padrão `7d`)           |
| `PORT`                    | Porta (padrão `4000`)                              |
| `CLIENT_ORIGIN`           | Origens CORS separadas por vírgula                 |

### `client/.env`
| Variável                   | Descrição                                |
| -------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`      | URL base da API (ex: `http://localhost:4000/api`) |
| `NEXT_PUBLIC_SOCKET_URL`   | URL do Socket.io (ex: `http://localhost:4000`)    |

---

## Usuários de teste (depois do seed)

| Tipo    | Email                    | Senha    |
| ------- | ------------------------ | -------- |
| Admin   | `admin@flowdesk.com`     | `123456` |
| Manager | `manager@flowdesk.com`   | `123456` |
| Member  | `member@flowdesk.com`    | `123456` |

---

## Deploy

### Front-end → Vercel
1. Importe o repositório no Vercel → **Root Directory:** `client`
2. **Framework preset:** Next.js (autodetectado)
3. Variáveis: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

### Back-end (HTTP) → Vercel serverless
1. Segundo projeto Vercel → **Root Directory:** `server`
2. Variáveis: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_ORIGIN`

### Back-end (Socket.io completo) → Render / Railway
> Vercel **serverless não suporta WebSockets persistentes**. Para real-time completo em produção:
> - Render: New Web Service → root `server` → build `npm install && npm run build` → start `node dist/index.js`
> - Railway: similar
> O front-end faz fallback gracioso para polling (60s) quando Socket.io não conecta.

### Banco → Neon
- https://neon.tech → New Project → cole o connection string em `DATABASE_URL`

---

## Decisões técnicas

### Por que JWT com refresh tokens?
Access tokens curtos (15min) reduzem janela de comprometimento. Refresh tokens longos (7d) com rotação evitam re-login frequente. `tokenVersion` no DB permite logout global (incremento invalida todos os refresh tokens emitidos).

### Por que `multiSchema` no Prisma?
O FlowDesk e os outros projetos do portfólio compartilham o mesmo Postgres (Neon free tier), mas em **schemas separados** (`flowdesk`, `quickorder`, `public`/TaskFlow). Mesmo padrão usado por SaaS multi-tenant.

### Por que @dnd-kit em vez de react-beautiful-dnd?
react-beautiful-dnd não é mais mantido e tem problemas com React 18 strict mode. @dnd-kit é a escolha moderna recomendada pela maioria dos times.

### Por que Socket.io vs polling?
Implementei **ambos**: Socket.io para real-time verdadeiro (latência <50ms) e fallback automático de polling (60s) quando o serverless host não suporta WebSockets persistentes. Em produção verdadeira, deploy em Render/Railway dá o real-time completo.

### Por que separar `position` em transação?
Mover tarefas exige reordenar peers em ambas as colunas (origem e destino). Uma transação Prisma garante atomicidade — ou todas as posições são atualizadas, ou nenhuma.

---

## Próximas melhorias

- [ ] Upload de avatar (S3/Cloudinary)
- [ ] Pesquisa global com debounce
- [ ] Activity logs por workspace
- [ ] Atalhos de teclado (Cmd+K command palette)
- [ ] Integração com calendar (export iCal)
- [ ] Dark mode no Recharts (cores condicionais)
- [ ] Testes (Vitest + Playwright)
- [ ] Deploy com Render para Socket.io de verdade

---

## Licença

MIT — veja [LICENSE](./LICENSE).
