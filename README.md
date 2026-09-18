# Haridas247/whatsapp-ai-agent

> **Multi-Tenant AI-Powered WhatsApp Business Receptionist & Appointment Booking SaaS**  
> *"Never miss a customer enquiry again."*

Tailored pilot for **Dr. Kumar Dental Clinic** (Anna Nagar, Chennai), with modular multi-tenant architecture designed for clinics, salons, real estate, and coaching centers.

---

## 🌟 Key Features

1. **Multi-Tenant SaaS Isolation**: Strict tenant scoping by `business_id` across businesses, users, customers, conversations, messages, services, staff, appointments, knowledge documents, vector chunks, and reminder queues.
2. **Multilingual AI Conversational Engine**: Fluent in **English, Tamil (தமிழ்), and Tanglish** (*"Doctor ku appointment venum"*, *"Tuesday 5pm slot iruka?"*, *"Consultation fee evlo?"*).
3. **Medical Emergency & Healthcare Guardrails**:
   - Administrative guidance only (timings, bookings, fees, location).
   - Never prescribes drugs or gives medical diagnoses.
   - Zero-delay immediate escalation upon emergency keywords (*"chest pain"*, *"severe bleeding"*, *"nenju vali"*, *"romba ratham"*).
4. **Deterministic Booking State Machine**:
   - `START` ➔ `SELECT_SERVICE` ➔ `SELECT_DATE` ➔ `SELECT_SLOT` ➔ `COLLECT_CUSTOMER_DETAILS` ➔ `CONFIRM` ➔ `BOOKED`.
   - Doctor availability calculation, lunch buffer preservation, and past-slot filtering.
   - **Atomic Concurrency Protection**: Database transaction slot locking prevents double-booking race conditions.
5. **RAG Knowledge Base (`pgvector`)**:
   - Automated 500-char chunking with 50-char overlap.
   - 768-dimensional vector embeddings via Google Gemini (`text-embedding-004`).
   - High-speed cosine distance similarity search strictly partitioned by `business_id`.
6. **Automated Reminders Queue (BullMQ + Upstash Redis)**:
   - Schedules automated WhatsApp reminders at **24 hours** and **2 hours** before confirmed appointments.
   - Auto-skips or cancels if the appointment is rescheduled or cancelled.
7. **Interactive Local CLI Simulator**:
   - Run `npm run simulate` to test real WhatsApp conversations, Tanglish inputs, and slot booking in your terminal!
8. **Next.js 14 Admin Web Dashboard**:
   - **Overview**: Real-time stats, today's schedule, AI resolution rate, escalation alerts.
   - **Appointments**: Interactive calendar and list view (confirm, complete, cancel).
   - **Knowledge Base**: Add/edit FAQs, re-index vector embeddings with live status.
   - **Live Chats**: Two-pane WhatsApp-style chat viewer with 1-click human agent takeover.
   - **Settings**: Business profile, treatment menu & pricing, Meta WhatsApp Cloud API credentials.

---

## 🏗️ Monorepo Architecture

```
whatsapp-ai-agent/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Multi-tenant schema with PostgreSQL pgvector extension
│   │   └── seed.ts             # Seeds Dr. Kumar Dental Clinic, Services, and Embeddings
│   ├── src/
│   │   ├── config/env.ts       # Environment variable loader
│   │   ├── lib/
│   │   │   ├── prisma.ts       # Prisma Client singleton
│   │   │   ├── gemini.ts       # Google GenAI SDK client
│   │   │   └── redis.ts        # Upstash Redis connection
│   │   ├── services/
│   │   │   ├── whatsapp.service.ts   # Meta Graph API v21.0 & Webhook normalizer
│   │   │   ├── gemini.service.ts     # Multilingual AI & emergency guardrail
│   │   │   ├── rag.service.ts        # pgvector chunking & cosine search
│   │   │   ├── booking.service.ts    # Deterministic booking state machine & atomic lock
│   │   │   ├── reminder.worker.ts    # BullMQ 24H & 2H scheduled reminders
│   │   │   └── handoff.service.ts    # Human escalation & takeover
│   │   ├── controllers/
│   │   │   ├── webhook.controller.ts # Inbound/Outbound Meta webhook handler
│   │   │   └── api.controller.ts     # Admin Dashboard REST APIs
│   │   ├── simulator/
│   │   │   └── chat-cli.ts           # Interactive terminal WhatsApp simulator
│   │   ├── server.ts                 # Express API server (Port 5000)
│   │   └── test_flow.ts              # Automated end-to-end verification
│   ├── .env
│   └── package.json
├── frontend/                         # Next.js 14 Admin Dashboard
│   ├── app/
│   │   ├── layout.tsx                # App shell with responsive navigation
│   │   ├── page.tsx                  # Executive Dashboard Overview
│   │   ├── appointments/page.tsx     # Calendar & Appointment management
│   │   ├── conversations/page.tsx    # Live WhatsApp Chat with 1-click Takeover
│   │   ├── knowledge/page.tsx        # Knowledge Base & pgvector re-indexing
│   │   └── settings/page.tsx         # Clinic profile, pricing & WhatsApp configuration
│   ├── lib/api.ts                    # Backend API client
│   └── package.json
└── package.json                      # Monorepo orchestrator
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18 (Tested on v20.11.0)
- PostgreSQL with `pgvector` (e.g. Supabase / Neon)
- Upstash Redis
- Google Gemini API Key

### 2. Environment Configuration
Create `backend/.env` (see `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development

# Database (Supabase PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_EMBEDDING_MODEL="text-embedding-004"

# Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your-business-account-id"
WHATSAPP_ACCESS_TOKEN="your-access-token"
WHATSAPP_VERIFY_TOKEN="whatsapp_agent_secure_token_2026"
WHATSAPP_API_VERSION="v21.0"

# Upstash Redis
REDIS_URL="rediss://default:token@leading-rhino-280234.upstash.io:6379"
```

### 3. Database Migration & Seeding
```bash
# Push schema to PostgreSQL with pgvector
npm run prisma:push

# Seed Dr. Kumar Dental Clinic, Services, and Knowledge Base with Vector Embeddings
npm run db:seed
```

### 4. Running the Local CLI WhatsApp Simulator
Test the complete conversation, Tanglish queries, and booking lifecycle directly in your terminal:
```bash
npm run simulate
```

### 5. Running the Full Stack App
```bash
# Start Backend API (Port 5000)
npm run dev:backend

# Start Next.js Admin Dashboard (Port 3000)
npm run dev:frontend
```

Access the Admin Dashboard at: **`http://localhost:3000`**

---

## 🛡️ Medical Emergency & Guardrail Protection

When a customer types acute medical symptoms (e.g., *"severe bleeding"*, *"chest pain"*, *"nenju vali"*, *"moochu vida mudila"*):
1. The assistant immediately triggers the emergency guardrail.
2. Bot replies are muted, conversation status transitions to `HUMAN_HANDOFF`.
3. An urgent medical alert is displayed on the Admin Dashboard.
4. The patient is instantly directed to call **108/112** or the clinic emergency hotline (`+91 98401 23456`).
