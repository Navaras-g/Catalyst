# CATALYST — Personal Productivity Platform
## Project Specification v2.0

---

## Overview

Catalyst is a personal full-stack productivity platform for 2 users.
Built to be the single app for managing tasks, projects, focus sessions,
habits, and personal goals. Docker-first development, free-tier deployment later.

---

## Users

- 2 users (private, invite-only, no public registration in production)
- Authentication is required for all features

---

## Core Philosophy

- Ship Phase 1 first. Use it. Then build Phase 2.
- No over-engineering. Simple beats clever.
- Docker-first. The app must run with a single `docker compose up`.
- Zero paid services at any stage.

---

## Feature Phases

### ✅ Phase 1 — Core (Build First)

#### 1. Auth & User System
- Register / Login / Logout
- JWT Authentication (httpOnly cookies, access + refresh tokens)
- Password change
- Basic user profile (name, avatar placeholder, timezone)
- Protected routes on frontend

#### 2. Task Management
- Create / Edit / Delete tasks
- Title, description, priority (Low / Medium / High / Urgent)
- Status (Todo / In Progress / Done)
- Due dates
- Categories and Tags
- Subtasks (checklist style)
- Assign task to a Project (optional)
- Kanban board view (Todo / In Progress / Done columns)
- List view
- Filter by priority, status, category, due date

#### 3. Project Management
- Create / Edit / Delete projects
- Title, description, color label, due date
- Group tasks under a project
- Project progress (% of tasks completed)
- Project status (Active / Completed / On Hold)

#### 4. Dashboard (Basic)
- Tasks due today
- Tasks completed this week
- Active projects summary
- Habit streak overview (placeholder until Phase 2)
- Recent activity feed

---

### ✅ Phase 2 — Depth

#### 5. Focus / Pomodoro Timer
- Configurable Pomodoro timer (default 25/5)
- Long break support (every 4 sessions)
- Link session to a task
- Session history log
- Focus stats (daily/weekly hours, sessions completed)

#### 6. Habit Tracking
- Create habits (daily / weekly)
- Log completion per day
- Streak tracking (current streak, longest streak)
- Habit completion calendar (heatmap style)
- Basic analytics (completion rate %)

---

### ✅ Phase 3 — Polish

#### 7. Gamification
- XP system (earn XP for completing tasks, habits, focus sessions)
- User level (based on XP thresholds)
- Achievements / Badges (milestone-based)
- Streak rewards

#### 8. Notes / Knowledge Vault
- Create / Edit / Delete markdown notes
- Link notes to tasks, projects, or goals
- Full-text search
- Tag notes

#### 9. Calendar View
- Month and week view
- Show tasks by due date
- Show focus sessions
- Static (no drag-and-drop in this phase)

---

### ⏸ Phase 4 — Deferred (Add Later)

- Real-time features (Django Channels / WebSockets)
- Celery + Redis background jobs
- Recurring tasks
- File attachments
- Browser push notifications
- Drag-and-drop calendar
- Goal management module
- AI integration (local, via Ollama)

---

## Technical Stack

### Frontend
| Concern         | Choice                          |
|-----------------|---------------------------------|
| Framework       | React 18 + TypeScript           |
| Build Tool      | Vite                            |
| Styling         | Tailwind CSS                    |
| UI Components   | ShadCN UI                       |
| Routing         | React Router v6                 |
| Server State    | TanStack Query (React Query v5) |
| Global State    | Zustand                         |
| Forms           | React Hook Form + Zod           |
| HTTP Client     | Axios                           |

### Backend
| Concern         | Choice                          |
|-----------------|---------------------------------|
| Framework       | Django 5 + Django REST Framework|
| Auth            | djangorestframework-simplejwt   |
| Token Storage   | httpOnly cookies                |
| CORS            | django-cors-headers             |
| DB Connector    | psycopg2                        |
| Env Vars        | python-decouple                 |

### Database
- PostgreSQL 16

### Dev Environment
- Docker + Docker Compose
- All services (Django, React, Postgres) in one `docker compose up`
- Hot reload for both frontend and backend in dev

### Deployment (Later, Free)
| Layer     | Service              |
|-----------|----------------------|
| Frontend  | Vercel               |
| Backend   | Render (free tier)   |
| Database  | Supabase (free tier) |

### Deployment Fallback
- Both users run the app locally via Docker
- `docker compose up` starts everything
- No internet dependency

---

## Database Entities

| Entity        | Key Fields                                                        |
|---------------|-------------------------------------------------------------------|
| User          | id, email, name, avatar, timezone, created_at                     |
| UserProfile   | user, xp, level, settings (JSON)                                  |
| Project       | id, user, title, description, color, status, due_date             |
| Task          | id, user, project(fk,null), title, desc, priority, status, due_date, category, estimated_minutes |
| SubTask       | id, task(fk), title, is_completed                                 |
| Category      | id, user, name, color                                             |
| Tag           | id, user, name                                                    |
| TaskTag       | task(fk), tag(fk)                                                 |
| Habit         | id, user, title, frequency (daily/weekly), created_at             |
| HabitLog      | id, habit(fk), date, completed                                    |
| FocusSession  | id, user, task(fk,null), duration_minutes, started_at, ended_at   |
| Note          | id, user, title, content (markdown), task(fk,null), project(fk,null) |
| Achievement   | id, name, description, xp_reward, icon                           |
| UserAchievement | user(fk), achievement(fk), earned_at                            |

---

## Project Folder Structure

catalyst/
├── backend/
│   ├── config/              # Django settings, urls, wsgi, asgi
│   ├── apps/
│   │   ├── users/
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── focus/
│   │   ├── habits/
│   │   └── dashboard/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client + TanStack Query hooks
│   │   ├── components/      # Shared/reusable UI components
│   │   ├── features/        # Feature-scoped modules
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── projects/
│   │   │   ├── focus/
│   │   │   ├── habits/
│   │   │   └── dashboard/
│   │   ├── store/           # Zustand stores
│   │   ├── router/          # Route definitions
│   │   ├── types/           # Global TypeScript types
│   │   └── lib/             # Utilities, helpers
│   ├── Dockerfile
│   └── vite.config.ts
│
├── docker-compose.yml
├── .env.example
└── README.md

---

## API Convention

- All endpoints prefixed with `/api/v1/`
- Auth endpoints: `/api/v1/auth/`
- JSON request/response throughout
- Standard HTTP status codes
- Error responses: `{ "error": "message" }` or `{ "field": ["error"] }`

---

## Dev Notes & Rules

1. Never store JWT access tokens in localStorage — httpOnly cookies only
2. Always prefix API routes with `/api/v1/`
3. Every model gets `created_at` and `updated_at` auto fields
4. All endpoints are user-scoped — a user can only access their own data
5. No feature from Phase 4 is to be partially built in earlier phases
6. Keep Docker Compose as the single source of truth for local dev