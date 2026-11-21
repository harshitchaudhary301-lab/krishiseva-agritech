# KrishiSeva — The Farm Operations Coordination Platform
### खेती की हर जरूरत, एक जगह।

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Backend-Django%205.2%20%2B%20DRF-092E20?style=flat&logo=django)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat&logo=render)](https://render.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

**Founder:** Harshit Chaudhary  
**Platform:** KrishiSeva (कृषि सेवा)  
**Positioning:** Farm Operations Coordination Platform for Rural India  
**Target Region:** Meerut Rural & Western Uttar Pradesh (architected for nationwide expansion)  
**Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)  

---

## 🌾 1. Overview & Core USP

**KrishiSeva** bridges Indian farmers with verified rural service providers—agricultural labourers, tractor mechanics, tubewell technicians, and custom hiring machinery operators—with transparent pricing and synchronized scheduling.

### 🌟 Core Differentiator: Farm Project Manager
Rather than booking disconnected services through unorganized phone calls, a farmer creates a unified **Farm Project** (e.g., *"Wheat Harvesting 2026 — 20 Acres"*). Within that project, the farmer coordinates:
1. **Combine Harvester Rental** (Machinery Fleet)
2. **Grain Bagging & Loading Labour** (Verified Agricultural Workers)
3. **Pre-Harvest Tractor Overhaul** (Tractor Mechanic)

Each service has its own scope, quotation review, booking confirmation, and milestone tracking.  
**Platform Integrity Rule:** A farm project is never marked "100% Ready" until every required service has a confirmed provider booking without double-booking conflicts.

---

## 🏛️ 2. Architecture & Technology Stack

```text
[ Client Layer ]          React 19 + Vite 8 + Tailwind CSS v4 + React Router 7
                                │
                                ▼ HTTPS / REST
[ Application Layer ]     Django 5.2 + Django REST Framework + Gunicorn + WhiteNoise
                                │
                                ▼ Connection Pooling
[ Persistence Layer ]     PostgreSQL (Production) / SQLite 3 (Local Development)
```

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, React Router 7, Lucide React, Axios.
- **Backend:** Python 3.11+, Django 5.2, Django REST Framework, Django Token Authentication.
- **Production Server:** Gunicorn WSGI + WhiteNoise static asset engine.
- **Production Database:** Managed PostgreSQL with SSL connection pooling.
- **Design System:**
  - Deep Forest Green: `#174D32`
  - Fresh Leaf Green: `#84B547`
  - Warm Sand Cream: `#F5F1E6`
  - Soft Field Background: `#F7F9F5`
  - Harvest Gold: `#E8B44C`
  - Typography: Dual English & Hindi Devanagari typography support.

---

## ⚡ 3. Quick Start — Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Step 1: Start Django Backend
Open PowerShell or bash in terminal 1:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 8000
```
- API Base: `http://127.0.0.1:8000/api/`
- Health Check: `http://127.0.0.1:8000/health/`
- Django Admin: `http://127.0.0.1:8000/admin/`

### Step 2: Start React Frontend
Open terminal 2:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173/`

---

## 👥 4. Seeded Demo Accounts

You can log in manually using the credentials below, or click the **"Quick Demo"** modal button on the landing page for instant role switching:

| Role | Username | Password | Full Name / Description |
| :--- | :--- | :--- | :--- |
| **Farmer** | `ramesh_farmer` | `farmer123` | Ramesh Patel (20 Acres Farm, Daurala) |
| **Worker** | `suresh_worker` | `worker123` | Suresh Kumar (Harvesting Lead, ₹500/day, 4.9★) |
| **Mechanic** | `vikram_mechanic` | `provider123` | Vikram Singh (Kisan Tractor Workshop, ITI Certified, 4.9★) |
| **Machinery** | `baldev_machinery`| `provider123` | Baldev Singh (Baldev Agro Fleet, Combine Harvesters) |
| **Tubewell** | `amit_tubewell` | `provider123` | Amit Verma (Verma Tubewell & Motor Works) |

*(Note: Default admin account creation with predictable credentials is strictly disabled for security. Production administrators must be created using `python manage.py createsuperuser`).*

---

## 🎬 5. Features & Workflow Walkthrough

1. **Role-Based Portals:** Dedicated layouts, stats, and workflows for Farmers, Agricultural Workers, and Service Providers.
2. **Farm Project Manager:** Track multiple crop operations, calculated readiness percentage, estimated budget, and actual expenses in real time.
3. **Quotation & Negotiation Engine:** Farmers publish service requests; nearby providers submit granular price breakdowns and schedules.
4. **Atomic Double-Booking Prevention:** Database-level transaction locks prevent a provider from being booked twice for the same date.
5. **Rule-Based Backup Provider Matching:** If a service provider cancels, the matching engine instantly surfaces top-rated backup providers within service radius.
6. **Dual Language Engine:** Instant toggle between English and Hindi with contextual agricultural terminology.
7. **Cinematic Intro:** Atmospheric visual introduction highlighting rural agricultural empowerment, with smooth replay and accessibility controls.

---

## ☁️ 6. Cloud Deployment (Vercel + Render)

KrishiSeva is pre-configured for automated cloud deployment:
- **Frontend (Vercel):** Configuration in `frontend/vercel.json` with SPA routing rewrites.
- **Backend (Render):** Production script in `backend/build.sh`, blueprint in `render.yaml`, and production settings in `backend/config/settings.py`.
- **Database (Render PostgreSQL):** Environment-based `DATABASE_URL` parsing via `dj-database-url`.

For step-by-step deployment instructions, refer to **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 🧪 7. Automated Testing & Verification

The backend test suite validates business logic, authorization boundaries, and concurrency constraints:

```bash
cd backend
python manage.py test accounts bookings farm_projects matching services
```

### Verified Test Suite:
- `test_01_user_registration_and_login` — PASSED
- `test_02_service_request_creation_and_matching` — PASSED
- `test_03_full_booking_quotation_workflow` — PASSED
- `test_04_double_booking_prevention` — PASSED
- `test_05_cancellation_and_backup_providers` — PASSED
- `test_06_farm_project_cost_and_readiness` — PASSED
- **Total: 6 of 6 tests passing (100% success rate).**
- **Django Security & Deployment Check (`manage.py check --deploy`):** 0 issues found.
- **Frontend Production Build (`vite build`):** 0 errors.

---

## 🔒 8. Security Implementations

- **Secrets Isolation:** No production secrets committed. `SECRET_KEY` strictly loaded from environment variables in production.
- **Database Safety:** SQLite database and local media excluded via `.gitignore`. Production operates on PostgreSQL.
- **CORS Protection:** In production, origins restricted to verified Vercel domains (`https://*.vercel.app`) and configured `FRONTEND_URL`.
- **CSRF Defense:** Django CSRF token enforcement with `CSRF_TRUSTED_ORIGINS`.
- **HTTPS Enforcement:** Strict Transport Security (HSTS), secure cookies (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`), and proxy SSL headers.
- **Server-Side Authorization:** Role validation on every endpoint preventing privilege escalation.

---

## ⚠️ 9. Known Limitations & Roadmap

- **Voice Search:** Currently marked as *(Coming Soon)* in the UI. Integration with speech recognition APIs scheduled for Phase 2.
- **Payment Gateway:** Currently operates on agreed quotations with on-site settlement tracking. UPI & Razorpay integration planned for future iterations.
- **SMS Gateway:** Notification system currently operates via in-app alerts; DLT-compliant SMS notifications planned for rural non-smartphone reach.

---

## 📄 License & Ownership
Copyright © 2026 Harshit Chaudhary. All Rights Reserved.  
Proprietary platform architecture for KrishiSeva Agritech.
