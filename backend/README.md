# 韬纪元AI Backend

NestJS REST API backend for the 韬纪元AI loan assistance platform.

## Tech Stack

- **Framework**: NestJS v10 (Node.js)
- **Database**: PostgreSQL 16 (via TypeORM)
- **Cache/Queue**: Redis + Bull
- **Auth**: JWT (passport-jwt)
- **File Storage**: Tencent Cloud COS (with local fallback)
- **API Docs**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7

### Option 1: Docker Compose (Recommended)

```bash
cd backend

# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Run database seed
npm run seed

# Start development server
npm run start:dev
```

### Option 2: Full Docker

```bash
docker-compose up -d
```

The schema is auto-applied via `001-initial-schema.sql` on first run.

### Option 3: Manual Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE taoji_db;
CREATE USER taoji WITH PASSWORD 'taoji123';
GRANT ALL PRIVILEGES ON DATABASE taoji_db TO taoji;
```

2. Apply schema:
```bash
psql -U taoji -d taoji_db -f src/database/migrations/001-initial-schema.sql
```

3. Install dependencies and start:
```bash
npm install
cp .env.example .env
# Edit .env with your settings
npm run start:dev
```

4. Seed initial data:
```bash
npm run seed
```

## Environment Variables

See `.env.example` for all required variables.

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | localhost | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `DATABASE_USER` | taoji | DB username |
| `DATABASE_PASS` | taoji123 | DB password |
| `DATABASE_NAME` | taoji_db | Database name |
| `JWT_SECRET` | changeme | JWT signing secret (**change in production!**) |
| `JWT_EXPIRES` | 7d | JWT expiry |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `APP_PORT` | 3000 | HTTP port |
| `WX_APP_ID` | | WeChat Mini Program AppID |
| `WX_APP_SECRET` | | WeChat Mini Program Secret |
| `AI_API_KEY` | | LLM API key (OpenAI-compatible) |
| `AI_BASE_URL` | https://api.openai.com/v1 | LLM API base URL |
| `COS_SECRET_ID` | | Tencent COS Secret ID |
| `COS_SECRET_KEY` | | Tencent COS Secret Key |
| `COS_BUCKET` | | COS Bucket name |
| `COS_REGION` | ap-guangzhou | COS Region |

## API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`

Base URL: `/api/v1`

### Authentication

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>` header.

Login first:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000","password":"Admin123"}'
```

### Demo Credentials (after seeding)

| Role | Phone | Password |
|------|-------|----------|
| Admin | 13800000000 | Admin123 |
| Advisor | 13900000001 | Advisor123 |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Phone + password login |
| POST | `/auth/wx-login` | WeChat mini program login |
| POST | `/auth/refresh` | Refresh JWT token |
| GET | `/auth/me` | Get current user |

### Customers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/customers` | List with search/filter |
| POST | `/customers` | Create customer |
| GET | `/customers/:id` | Customer detail |
| PUT | `/customers/:id` | Update customer |
| GET | `/customers/:id/overview` | 360 portrait |
| GET | `/customers/:id/documents` | Document list |
| GET | `/customers/:id/follow-ups` | Follow-up timeline |
| POST | `/customers/:id/follow-ups` | Add follow-up |
| GET | `/customers/:id/report-tasks` | Report tasks |
| GET | `/customers/:id/recognition-summary` | AI gap analysis |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/documents/upload` | Upload document (multipart) |
| DELETE | `/documents/:id` | Delete document |

### AI Recognition
| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/recognize` | Trigger async AI recognition |
| GET | `/ai/recognize/:taskId` | Poll task status |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/report-tasks` | List report tasks |
| POST | `/report-tasks` | Create AI fill task |
| GET | `/report-tasks/:id` | Task detail + field drafts |
| PUT | `/report-tasks/:id/fields/:fieldId` | Advisor reviews field |
| POST | `/report-tasks/:id/approve` | Approve all fields |
| POST | `/report-tasks/:id/export` | Export ZIP package |
| POST | `/report-tasks/:id/submit` | Mark submitted to bank |

### Banks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/banks` | Bank list |
| GET | `/banks/:id/products` | Products by bank |
| GET | `/bank-products/:id/material-config` | Field config |

### Memberships
| Method | Path | Description |
|--------|------|-------------|
| GET | `/membership-plans` | Plan list |
| GET | `/institution/subscription` | Current subscription + quota |
| POST | `/institution/upgrade-request` | Upgrade request |
| GET | `/call-records` | Quota consumption log |

### Institution Members
| Method | Path | Description |
|--------|------|-------------|
| GET | `/institution/members` | Employee list |
| POST | `/institution/members` | Add employee |
| PUT | `/institution/members/:id/permissions` | Update permissions |
| PUT | `/institution/members/:id/status` | Enable/disable |

### Config
| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/ai-fill-rules` | AI fill rules |
| GET | `/platform-configs` | Platform configs (admin) |
| GET/POST/DELETE | `/api-keys` | API key management |

### C-End (Customer)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/c/session` | Create customer session |
| POST | `/c/chat` | Send message, get AI reply |
| GET | `/c/progress` | Check application progress |
| POST | `/c/documents/upload` | Customer upload document |

## Response Format

All responses follow this format:
```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

Errors:
```json
{
  "code": 401,
  "message": "Token invalid or expired",
  "data": null
}
```

## Roles & Permissions

### Roles
- `admin` — Full access to all data and settings
- `supervisor` — Can manage team members, see all team data
- `advisor` — Default, sees only own customers (based on `data_scope`)

### Data Scope
- `self` — Only own customers
- `team` — Team customers
- `all` — All institution customers

### Permission Keys
- `view_customer` — View customer data
- `edit_customer` — Edit customer info
- `edit_followup` — Add follow-up records
- `ai_parse` — Trigger AI recognition
- `maintain_bank_material` — Manage bank/product configs
- `manage_plan` — Manage membership plans
- `manage_account` — Manage user accounts
- `config_permission` — Configure permissions

## Architecture Notes

### AI Service
The AI service is fully stubbed. To integrate a real LLM:
1. Set `AI_API_KEY` and `AI_BASE_URL` in `.env`
2. The `ChatService.callAiApi()` method makes OpenAI-compatible API calls
3. The `AiProcessor` handles async document recognition via Bull queue

### File Upload
- If `COS_SECRET_ID`, `COS_SECRET_KEY`, and `COS_BUCKET` are set, files upload to Tencent COS
- Otherwise, files save locally to `./uploads/` and are served at `/uploads/`

### Queue Processing
AI recognition tasks are processed asynchronously via Bull + Redis. The processor:
1. Receives task from queue
2. Runs mock OCR/LLM recognition per document
3. Writes results to `ai_recognition_results`
4. Updates `customers.doc_completeness`
5. Sets task status to `done` or `failed`

## Compliance Notes

Per spec requirements:
- AI results always include disclaimer: "AI输出仅供参考，最终以银行及持牌金融机构审核为准"
- No loan amount commitments in AI responses
- All AI outputs require advisor review before submission (`review_status` workflow)
- All quota-consuming operations are recorded in `call_records`
- Customer data access is controlled by `data_scope` field

## Development

```bash
# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod

# Run tests
npm run test
```
