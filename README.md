# SEO Director – SEO Analysis Dashboard

## Overview

A premium, full-stack SEO analysis dashboard for advanced site audits, competitor tracking, and real-time insights. Built with Next.js, Node.js/Express, PostgreSQL (Prisma), Redis, JWT auth, Zod validation, and WebSockets.

---

## Key Features

- **Comprehensive SEO analysis**: Projects, analyses, issues, trends, notifications
- **Real-time updates**: WebSocket-powered notifications and events
- **Robust API**: RESTful, documented with OpenAPI/Swagger
- **Secure**: JWT auth, Zod validation, rate limiting, resource ownership checks
- **Developer Experience**: Prettier, ESLint, Husky pre-commit hooks, scripts for DX
- **CI/CD**: GitHub Actions for test, lint, build, deploy

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Node.js, Express, Prisma, PostgreSQL, Redis
- **Auth**: JWT (access/refresh), Zod validation
- **Real-time**: Socket.IO
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions

---

## Local Development with Docker (Recommended)

### 1. Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development without Docker)

### 2. Clone & Setup

```sh
git clone <repo-url>
cd rival-outranker
cp .env.example .env  # Update values if needed
```

### 3. Start All Services with Docker Compose

```sh
docker-compose up --build
```

This will start:

- Frontend (Next.js) on <http://localhost:3000>
- Backend API on <http://localhost:4000>
- PostgreSQL database on port 5432
- Redis on port 6379

### 4. Access the Application

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:4000>
- PostgreSQL: localhost:5432 (user: postgres, password: postgres)
- Redis: localhost:6379

### 5. Seed the Database

```sh
docker-compose exec backend npm run seed
```

### 6. Reset the Database

```sh
docker-compose exec backend npm run reset-db
```

## Development Without Docker

### 1. Install Dependencies

```sh
npm install
cd backend && npm install && cd ..
```

### 2. Start Services

Start the required services using Docker:

```sh
docker-compose up -d postgres redis
```

### 3. Run the Applications

In separate terminals:

```sh
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev
```

### 4. Database Migrations

```sh
cd backend
npm run migrate:dev
```

### 5. Seed Data

```sh
npm run seed
```

---

## Testing & CI

- **Run all tests:**

  ```sh
  npm test
  ```

- **CI/CD:**
  - GitHub Actions: `.github/workflows/ci.yml` runs lint, test, build on every push/PR

---

## Linting & Formatting

- **Lint:** `npm run lint`
- **Format:** `npm run format`
- **Pre-commit hooks:** Husky runs lint & format check before every commit
- **Setup hooks:** `npm run prepare` (run after install)

---

## Deployment

- **CI/CD:** See `.github/workflows/ci.yml` for build/test/deploy pipeline
- **Docker:** Use `docker-compose.yml` for local DB/Redis
- **Netlify/Vercel:** See `netlify.toml` or add your own deploy step

---

## API Documentation

- **Swagger/OpenAPI:**
  - [OpenAPI Spec (YAML)](backend/docs/openapi.yaml)
  - Swagger UI available at `/api/docs` when backend is running

---

## Security & Best Practices

- JWT auth, Zod validation, rate limiting, resource ownership enforced
- Security-focused integration tests in `backend/tests/*security.test.ts`
- Pre-commit hooks prevent bad code from landing
- All secrets in `.env` (never commit to git)

---

## Contribution & Support

- PRs welcome! Please lint/format before submitting
- For questions, open an issue or contact the maintainer

---

## Handoff Notes

- All major features, tests, and docs are in place
- See onboarding note in `package.json`
- For new devs: `npm install` → `npm run prepare` → `npm run dev`

---

## Quick Start

```sh
git clone <repo-url>
cd rival-outranker
npm install
npm run prepare
npm run dev
```

---

## Docs & Links

- [OpenAPI Spec](backend/docs/openapi.yaml)
- [CI/CD Workflow](.github/workflows/ci.yml)
- [Docker Compose](docker-compose.yml)
- [Netlify Config](netlify.toml)

---

## Contact

- Maintainer: [Your Name/Email]
- For support, open an issue on GitHub
