# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**韬纪元AI** — A multi-tier platform for AI-powered loan assistance: advisors collect customer data, AI generates loan reports and fills forms, institutions review and package documents for banks.

The repo contains four sub-projects:

| Directory | Type | Users | AppID / Port |
|-----------|------|-------|-------------|
| `miniprogram_advisor/` | WeChat Mini Program | Loan advisors | See `project.config.json` |
| `miniprogram_c/` | WeChat Mini Program | Loan customers | `wxc9ebcb4c289511eb` |
| `webapp_b/` | React SPA (Vite) | Institution managers | `localhost:5173` |
| `backend-java/` | Spring Boot REST API | All clients | `localhost:3000` |

## Development Environment

### WeChat Mini Programs (`miniprogram_advisor/`, `miniprogram_c/`)
No npm build step — WeChat DevTools compiles TypeScript → JS and SCSS → WXSS automatically.

```bash
# Install type definitions (one-time, per mini-program)
cd miniprogram_advisor && npm install
cd miniprogram_c && npm install
```

Open each mini-program directory in **WeChat DevTools** (微信开发者工具). The advisor mini-program is the one actively under development.

### Web App (`webapp_b/`)
```bash
cd webapp_b && npm install
npm run dev      # Vite dev server → localhost:5173
npm run build    # Production build
```

### Backend (`backend-java/`)
Requires PostgreSQL running locally (`taoji_db`, user `taoji`, password `taoji123`).

```bash
cd backend-java
./mvnw spring-boot:run          # Start server on :3000
./mvnw test                     # Run all tests
./mvnw test -Dtest=MyTest       # Run a single test class
./mvnw compile                  # Compile only (triggers jOOQ codegen if schema changed)
```

Swagger UI: `http://localhost:3000/swagger-ui.html`

## Architecture

### API Layer

All clients call the backend at `/api/v1`. Authentication is JWT via Bearer token.

**Mini-programs** use `wx.request()` directly — no shared HTTP client. The API base is set in `miniprogram_c/miniprogram/utils/config.ts` (`API_BASE`). For advisor mini-program, the base URL is inlined in each `wx.request` call. During local development, set the IP to your LAN address (phone cannot reach `localhost`).

**webapp_b** uses a typed wrapper in `src/utils/api.ts` (`request<T>(method, path, body)`) — 401 responses auto-redirect to `/login`.

**Authentication flow** (same for both mini-programs):
1. `wx.login()` → WeChat code
2. `POST /auth/wx-login` with code (customer: include `advisorId` from scene param `a=` if binding via QR)
3. Backend returns JWT → stored in `wx.setStorageSync('token')`
4. Pages use `app.loginReadyCallback` to defer logic until login completes

### Backend Stack

- **Spring Boot 3.3.4** + Java 17
- **jOOQ 3.19.10** — type-safe SQL; POJOs/Records auto-generated from the DB schema. Run `./mvnw compile` after schema migrations to regenerate.
- **Flyway** — database migrations in `src/main/resources/db/migration/V*.sql`
- **Spring Security** — JWT filter chain, role-based access
- **WebFlux** `WebClient` — async calls to WeChat servers and AI APIs

Modules under `src/main/java/com/taoji/modules/`: `auth`, `advisor`, `customers`, `documents`, `chat`, `reports`, `banks`, `ai`, `institutions`, `memberships`, `dashboard`, `users`, `settings`, `appconfig`.

### WeChat Mini Program Conventions

- Pages: `Page({})`, Components: `Component({})`
- Global state on `app.globalData` (access via `getApp<IAppOption>()`)
- Navigation: `wx.navigateTo()` / `wx.navigateBack()`
- **Renderer:** Skyline (`"componentFramework": "glass-easel"` in `app.json`)
- **Lazy loading:** `"lazyCodeLoading": "requiredComponents"` — only declare components a page actually uses in its `.json`
- **Styling:** `"navigationStyle": "custom"` globally; each page/component has co-located `.scss`; global styles in `app.scss`

### TypeScript

Strict mode throughout (`noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`). WeChat API types live in `typings/types/` — do not use `wx.*` APIs without type coverage in that directory.

## Documentation

Feature specs and UI screenshots: `docs/韬纪元AI_公网功能清单_20260615/`

Key platform constraints:
- Does **not** directly issue loans or guarantee amounts
- All AI-generated results require advisor review before submission
