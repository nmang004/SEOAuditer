# Rival Outranker – SEO Analysis Dashboard

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

## Local Development

### 1. Clone & Install
```sh
git clone <repo-url>
cd rival-outranker
npm install
```

### 2. Environment Setup
- Copy `.env.example` to `.env` and fill in required values (DB, Redis, JWT, etc).
- For local dev, defaults are provided in `docker-compose.yml`.

### 3. Start Services
```sh
docker-compose up -d  # Start Postgres & Redis
```

### 4. Run the App
```sh
npm run dev           # Next.js frontend
npm run --prefix backend dev   # Backend API
```

### 5. Seed the Database
```sh
npm run seed          # Seeds mock data (backend/scripts/seed-mock-data.ts)
```

### 6. Reset the Database
```sh
npm run reset-db      # Drops, migrates, and seeds DB
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