# Kanban Board Feature Module

This directory contains the **production-ready Kanban board** implementation.  
Every label, comment, and doc-string is written in plain English for clarity.

## Directory Layout

```
kanbanBoard/
├─ backend/              # Express + TypeScript API & WebSocket gateway
│  ├─ controllers/
│  │  ├─ board.controller.ts
│  │  ├─ column.controller.ts
│  │  └─ task.controller.ts
│  ├─ dto/               # Zod DTOs for request validation
│  ├─ middleware/        # JWT + RBAC guards
│  ├─ services/          # Business logic separated from controllers
│  ├─ prisma/            # Prisma models & migrations
│  └─ index.ts           # Stand-alone express app (can be merged with main API)
├─ frontend/
│  ├─ components/
│  │  ├─ KanbanCanvas.tsx
│  │  ├─ ColumnList.tsx
│  │  ├─ KanbanColumn.tsx
│  │  ├─ TaskCard.tsx
│  │  ├─ AddColumnBtn.tsx
│  │  ├─ AddTaskBtn.tsx
│  │  └─ Toolbar.tsx
│  └─ hooks/
│     ├─ useKanbanData.ts
│     └─ useDragAndDrop.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ component/
└─ README.md             # You are here
```

## Quick Start (Frontend)

```bash
# Install dependencies (drag-and-drop, websockets, etc.)
npm i @dnd-kit/core @dnd-kit/sortable react-resizable-panels zustand socket.io-client
```

Import the _KanbanCanvas_ component anywhere inside your React tree:

```tsx
import { KanbanCanvas } from '@/src/features/kanbanBoard/frontend/components/KanbanCanvas';

function KanbanPage() {
  return <KanbanCanvas boardId="demo-board" />;
}
```

`KanbanCanvas` provides infinite pan/zoom and hosts all columns and tasks.  
For local-state use only, everything persists via React state.  
When `useKanbanData` is pointed at the API base URL, it auto-syncs.

## Quick Start (Backend)

```bash
cd src/features/kanbanBoard/backend
npm i
npm run dev
```

The server exposes:

* `POST   /kanban/boards`  – create board
* `GET    /kanban/boards/:id`  – fetch board with columns & tasks
* `PATCH  /kanban/columns/:id`  – update column title or order
* `POST   /kanban/tasks`  – create task, etc.

Each controller uses **Zod DTOs** to validate the request body.

### Real-Time

A Socket.IO gateway broadcasts events:

* `board.updated`, `column.created`, `task.deleted`, etc.
* Client hook `useKanbanSocket` subscribes and merges updates into the store.

## Environment Variables Example

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/kanban"
JWT_SECRET="change-me"
WEBSOCKET_ORIGIN="http://localhost:3000"
```

## Tests & CI

* Vitest for unit tests (`npm run test`)
* Supertest for integration tests (API)
* React Testing Library for component drag-and-drop
* GitHub Actions workflow in `.github/workflows/ci.yml`

---
_Anything missing? Open an issue or drop a TODO in the corresponding file._ 