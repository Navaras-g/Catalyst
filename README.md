# Catalyst

A personal full-stack productivity platform for managing tasks, projects, focus sessions, habits, notes, and goals. Built for private use, Docker-first, with zero paid services.

## Features

- **Auth** — Register, login, JWT via httpOnly cookies
- **Tasks** — CRUD, priorities, status, due dates, categories, tags, subtasks, list & kanban views
- **Projects** — Group tasks, track progress and status
- **Dashboard** — Due today, weekly stats, active projects, activity feed
- **Focus** — Pomodoro timer with session history and stats
- **Habits** — Daily/weekly tracking with streaks and analytics
- **Notes** — Markdown knowledge vault with search and tags
- **Calendar** — Month/week view for tasks and focus sessions
- **Gamification** — XP, levels, and achievements

## Tech Stack

| Layer    | Stack |
|----------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind, TanStack Query, Zustand |
| Backend  | Django 5, Django REST Framework, SimpleJWT |
| Database | PostgreSQL 16 |
| Dev      | Docker Compose |

## Quick Start

**Prerequisites:** Docker and Docker Compose

1. Clone the repo and create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key
POSTGRES_DB=catalyst
POSTGRES_USER=catalyst
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=db
VITE_API_URL=http://localhost:8000
```

2. Start all services:

```bash
docker compose up
```

3. Open the app:

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |

Migrations run automatically on backend startup.

## Project Structure

```
catalyst/
├── backend/          # Django API (apps: users, tasks, projects, focus, habits, dashboard, notes)
├── frontend/         # React SPA (feature-based modules)
├── docker-compose.yml
└── .env              # Local env (not committed)
```

## API

All endpoints are prefixed with `/api/v1/`. Auth routes live under `/api/v1/auth/`.
