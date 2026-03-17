# ICIS SaaS Platform — Complete Developer Guide

> **Indian Cognitive Intelligence System** — Agentic AI SaaS Platform

---

## 📁 Project Structure

```
icis-saas/
├── backend/                  # Node.js + Express + Prisma API
│   ├── src/
│   │   ├── index.ts          # Express server entry point
│   │   ├── config/           # DB, JWT, Logger
│   │   ├── middleware/        # Auth guards (JWT + API key)
│   │   ├── routes/           # All API endpoints
│   │   └── services/         # Email, etc.
│   ├── prisma/
│   │   └── schema.prisma     # Full DB schema
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                 # React + Vite + Tailwind SPA
│   ├── src/
│   │   ├── App.tsx           # Router + protected routes
│   │   ├── pages/            # Landing, Login, Register, Dashboard/*
│   │   ├── store/            # Zustand auth store
│   │   └── lib/              # Axios client with auto-refresh
│   ├── Dockerfile
│   └── vercel.json
│
├── infra/
│   ├── nginx/nginx.conf      # Production reverse proxy
│   ├── terraform/main.tf     # Full AWS infrastructure
│   └── wrangler.toml         # Cloudflare config
│
├── .github/workflows/
│   └── deploy.yml            # CI/CD: test → build → deploy
│
└── docker-compose.yml        # Local dev environment
```

---

## ⚡ Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### 1. Clone & install
```bash
git clone https://github.com/your-org/icis-saas.git
cd icis-saas

# Backend
cd backend && cp .env.example .env && npm install

# Frontend
cd ../frontend && cp .env.example .env && npm install
```

### 2. Start database & Redis
```bash
docker compose up -d postgres redis
```

### 3. Set up database
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run dev servers
```bash
# From root — runs both simultaneously
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/health

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://icis_user:icis_secret@localhost:5432/icis_db"
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:4000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🛠 API Endpoints Reference

### Authentication
| Method | Endpoint                      | Description           |
|--------|-------------------------------|-----------------------|
| POST   | `/api/auth/register`          | Register new user     |
| POST   | `/api/auth/login`             | Login, get tokens     |
| POST   | `/api/auth/refresh`           | Refresh access token  |
| POST   | `/api/auth/logout`            | Invalidate session    |
| GET    | `/api/auth/me`                | Get current user      |
| POST   | `/api/auth/forgot-password`   | Send reset email      |
| POST   | `/api/auth/reset-password`    | Reset password        |
| GET    | `/api/auth/verify-email/:tok` | Verify email          |

### Agents
| Method | Endpoint                  | Description         |
|--------|---------------------------|---------------------|
| GET    | `/api/agents`             | List agents         |
| POST   | `/api/agents`             | Create agent        |
| GET    | `/api/agents/:id`         | Get agent           |
| PATCH  | `/api/agents/:id`         | Update agent        |
| DELETE | `/api/agents/:id`         | Archive agent       |
| POST   | `/api/agents/:id/run`     | Trigger agent run   |
| GET    | `/api/agents/:id/runs`    | Get run history     |

### API Keys
| Method | Endpoint        | Description       |
|--------|-----------------|-------------------|
| GET    | `/api/keys`     | List keys         |
| POST   | `/api/keys`     | Generate new key  |
| DELETE | `/api/keys/:id` | Revoke key        |

### Billing (Stripe)
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/billing/plans`        | Get available plans      |
| POST   | `/api/billing/checkout`     | Create Stripe checkout   |
| POST   | `/api/billing/portal`       | Customer billing portal  |
| GET    | `/api/billing/subscription` | Current subscription     |
| GET    | `/api/billing/invoices`     | Invoice history          |

### Contact
| Method | Endpoint        | Description     |
|--------|-----------------|-----------------|
| POST   | `/api/contact`  | Submit query    |

---

## 🚀 Deployment

### Option A — Vercel (Frontend) + Railway/Render (Backend)

**Frontend → Vercel:**
```bash
cd frontend
npx vercel --prod
# Set env: VITE_API_URL=https://your-backend.railway.app/api
```

**Backend → Railway:**
```bash
# Push to GitHub, connect Railway to repo
# Set all env vars in Railway dashboard
# Railway auto-detects Dockerfile
```

---

### Option B — Vercel (Frontend) + AWS ECS (Backend)

**Step 1: Provision AWS infrastructure**
```bash
cd infra/terraform
terraform init
terraform plan -var="db_password=yourpassword" -var="jwt_secret=yoursecret"
terraform apply
```

**Step 2: Build and push Docker images**
```bash
# Authenticate ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <YOUR_ECR_REGISTRY>

# Build & push backend
docker build -t icis-backend ./backend
docker tag icis-backend:latest <ECR_URL>/icis-production-backend:latest
docker push <ECR_URL>/icis-production-backend:latest

# Build & push frontend
docker build -t icis-frontend ./frontend
docker push <ECR_URL>/icis-production-frontend:latest
```

**Step 3: Deploy frontend to Vercel**
```bash
cd frontend
npx vercel --prod
```

---

### Option C — Full Docker Compose (VPS / EC2)

```bash
# On your server (Ubuntu 22.04)
git clone https://github.com/your-org/icis-saas.git
cd icis-saas

# Set env vars
cp backend/.env.example backend/.env
nano backend/.env   # fill in production values

# Start everything
docker compose -f docker-compose.yml up -d

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Check status
docker compose ps
docker compose logs -f backend
```

---

### Option D — Cloudflare Pages (Frontend)

```bash
cd frontend

# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy frontend to Cloudflare Pages
wrangler pages deploy dist --project-name=icis
```

---

## 💳 Stripe Setup

1. Create account at https://stripe.com
2. Create 3 products in Stripe Dashboard:
   - **Starter**: ₹2,999/month
   - **Pro**: ₹9,999/month
   - **Enterprise**: Custom
3. Copy Price IDs to `backend/.env`
4. Set up webhook:
   - URL: `https://your-api.com/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.payment_*`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 📧 Email Setup (SendGrid)

1. Create SendGrid account
2. Create API key with "Mail Send" permission
3. Verify your sender domain (`noreply@icis.ai`)
4. Set `SMTP_PASS=your_sendgrid_api_key` in `.env`

---

## 🔒 Security Checklist (Production)

- [ ] Rotate all JWT secrets
- [ ] Enable RDS encryption at rest
- [ ] Set up VPC with private subnets for DB
- [ ] Enable CloudTrail for AWS audit logs
- [ ] Configure WAF rules on ALB
- [ ] Set up automated database backups
- [ ] Rotate Stripe keys periodically
- [ ] Enable 2FA on AWS root account
- [ ] Review IAM permissions (least privilege)
- [ ] Set up CloudWatch alarms

---

## 🧪 Tech Stack Summary

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Framer Motion   |
| State       | Zustand, TanStack Query                       |
| Backend     | Node.js, Express, TypeScript                  |
| Database    | PostgreSQL via Prisma ORM                     |
| Auth        | JWT (access + refresh tokens) + API keys      |
| Billing     | Stripe Subscriptions + Webhooks               |
| Email       | Nodemailer + SendGrid SMTP                    |
| Infra       | Docker, Nginx, Terraform (AWS)                |
| CI/CD       | GitHub Actions                                |
| Hosting     | Vercel (FE) / AWS ECS Fargate (BE)            |

---

## 📞 Contact

**Indian Cognitive Intelligence System Pvt. Ltd.**
- 📍 Dehradun, Uttarakhand, India — 248001
- 📧 hello@icis.ai | support@icis.ai
- 📞 +91 98765 43210
- 🌐 www.icis.ai
