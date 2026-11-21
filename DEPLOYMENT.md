# KrishiSeva Production Deployment Guide
**Founder:** Harshit Chaudhary  
**Platform:** KrishiSeva (कृषि सेवा) — The Farm Operations Coordination Platform  
**Target Repository:** `krishiseva-agritech`  
**Architecture:** React + Vite (Vercel) | Django REST Framework (Render) | PostgreSQL (Render)

---

## 🏛️ Architecture Overview

```text
[ Farmer / Worker / Provider (Browser / Mobile) ]
                        │
                        ▼ (HTTPS)
        ┌──────────────────────────────┐
        │  Vercel Edge Network (CDN)   │
        │  React 19 + Vite Frontend    │
        │  Static Assets + SPA Routing │
        └──────────────┬───────────────┘
                       │
                       ▼ API Requests (HTTPS / JSON)
        ┌──────────────────────────────┐
        │       Render Web Service     │
        │    Gunicorn + WhiteNoise     │
        │   Django 5.2 REST Platform   │
        └──────────────┬───────────────┘
                       │
                       ▼ TCP / SSL
        ┌──────────────────────────────┐
        │     Render PostgreSQL DB     │
        │  Managed Relational Storage  │
        └──────────────────────────────┘
```

---

## 🚀 Pre-Deployment Audit Summary

| Component | Dev Configuration | Production Configuration |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 | React 19 + Vite 8 (Optimized Rollup build) |
| **Frontend Hosting** | Localhost (Vite dev server) | Vercel CDN with `vercel.json` SPA routing |
| **API Base URL** | `http://127.0.0.1:8000/api` | Environment variable `VITE_API_BASE_URL` |
| **Backend Framework** | Django 5.2 + DRF | Django 5.2 + Gunicorn application server |
| **Backend Hosting** | Django `runserver` | Render Web Service (Python 3.11/3.12) |
| **Static Files** | Django static finder | WhiteNoise Compressed Manifest Storage |
| **Database** | SQLite 3 (`db.sqlite3`) | PostgreSQL (via `DATABASE_URL`) |
| **Secrets Management** | Insecure fallback key | Environment `DJANGO_SECRET_KEY` |
| **CORS / CSRF** | Wildcard / Localhost | Restricted to Vercel production domain + preview regex |
| **Health Check** | None | `/health/` and `/api/health/` (HTTP 200 with DB probe) |

---

## 📋 STEP 1: Git Initialization & GitHub Repository Creation

If Git is not yet installed on your Windows machine:
1. Install Git via the official installer: [https://git-scm.com/download/win](https://git-scm.com/download/win) or run `winget install --id Git.Git -e --source winget` in PowerShell.
2. Verify installation: `git --version`.

### Initialize and Commit Source Code:
Open PowerShell in the project directory (`C:\Users\Harshit\Downloads\krishi`):

```powershell
# 1. Initialize Git repository
git init

# 2. Configure Git user credentials if not already set
git config user.name "Harshit Chaudhary"
git config user.email "your-email@example.com"

# 3. Verify sensitive files are ignored (db.sqlite3, node_modules, .env should NOT appear)
git status

# 4. Stage all prepared project files
git add .

# 5. Commit
git commit -m "feat: complete production-ready KrishiSeva platform with Vercel and Render configs"
```

### Create and Push to GitHub:
1. Go to [https://github.com/new](https://github.com/new).
2. Repository name: **`krishiseva-agritech`**.
3. Visibility: **Public** or **Private** (recommended: Public for portfolio/review).
4. Do **NOT** initialize with README or .gitignore (we have created comprehensive versions).
5. Click **Create repository**.
6. Run the following in your terminal:

```powershell
git branch -M main
git remote add origin https://github.com/<your-github-username>/krishiseva-agritech.git
git push -u origin main
```

*(If you have GitHub CLI `gh` installed and authenticated, you can simply run: `gh repo create krishiseva-agritech --public --source=. --remote=origin --push`)*.

---

## 🐘 STEP 2: Deploy Django Backend to Render

### 2.1 Create PostgreSQL Database on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → Select **PostgreSQL**.
3. Name: `krishiseva-db`.
4. Database: `krishiseva`.
5. User: `krishiseva`.
6. Region: Select **Singapore (ap-southeast-1)** or **Frankfurt (eu-central-1)** for best latency to India.
7. Plan: **Free**.
8. Click **Create Database**.
9. Once created, copy the **Internal Database URL** (or `Connection String`).

### 2.2 Create Backend Web Service on Render
1. In Render Dashboard, click **New +** → Select **Web Service**.
2. Connect your GitHub repository: `krishiseva-agritech`.
3. Configure the service settings:
   - **Name:** `krishiseva-backend`
   - **Region:** Same region as your database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `chmod +x build.sh && ./build.sh`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
   - **Plan:** `Free`
4. Expand **Advanced** → Click **Add Environment Variable**:

| Variable Name | Recommended Value / Source |
| :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` |
| `DEBUG` | `False` |
| `DJANGO_SECRET_KEY` | *(Click "Generate" or provide a secure 50+ character string)* |
| `DATABASE_URL` | *(Link to `krishiseva-db` database or paste Connection String)* |
| `ALLOWED_HOSTS` | `.onrender.com,krishiseva-backend.onrender.com` *(plus your Vercel domain)* |
| `CORS_ALLOWED_ORIGINS` | `https://krishiseva-agritech.vercel.app,http://localhost:5173` |
| `CSRF_TRUSTED_ORIGINS` | `https://krishiseva-agritech.vercel.app,https://*.vercel.app,https://*.onrender.com` |
| `FRONTEND_URL` | `https://krishiseva-agritech.vercel.app` |
| `SECURE_SSL_REDIRECT` | `True` |

5. Click **Create Web Service**.
6. Render will automatically execute `build.sh`:
   - Installs dependencies from `requirements.txt`
   - Runs `python manage.py collectstatic --no-input`
   - Runs `python manage.py migrate`
7. When deployment completes, note your live backend URL (e.g., `https://krishiseva-backend.onrender.com`).
8. Verify health check: Navigate to `https://krishiseva-backend.onrender.com/health/` (should return HTTP 200 with `status: "healthy"`).

### 2.3 Create Production Administrator & Seed Demo Data
In Render Dashboard:
1. Open your `krishiseva-backend` web service.
2. Click the **Shell** tab on the left menu.
3. Create your secure production administrator:
   ```bash
   python manage.py createsuperuser
   ```
   Follow the prompts to enter username, email, and a secure password.
4. *(Optional)* Seed fictional demo data for platform presentation:
   ```bash
   python manage.py seed_demo_data --skip-admin
   ```
   *(Note: The `--skip-admin` flag prevents creating an insecure default admin account in production).*

---

## ⚡ STEP 3: Deploy React Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `krishiseva-agritech`.
4. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** → select `frontend` → Click **Continue**.
   - **Build Command:** `npm run build` *(default)*
   - **Output Directory:** `dist` *(default)*
   - **Install Command:** `npm install` *(default)*
5. Expand **Environment Variables**:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://krishiseva-backend.onrender.com/api` *(Your Render backend URL with `/api`)*
6. Click **Deploy**.
7. Vercel will build the frontend and provide your live HTTPS domain (e.g., `https://krishiseva-agritech.vercel.app`).

---

## 🔗 STEP 4: Finalize Cross-Origin Integration

Now that you have both live URLs:
1. Copy your Vercel URL (e.g. `https://krishiseva-agritech.vercel.app`).
2. Go back to Render Dashboard → `krishiseva-backend` → **Environment**.
3. Update these variables with your exact Vercel domain:
   - `FRONTEND_URL`: `https://krishiseva-agritech.vercel.app`
   - `CORS_ALLOWED_ORIGINS`: `https://krishiseva-agritech.vercel.app,http://localhost:5173`
   - `CSRF_TRUSTED_ORIGINS`: `https://krishiseva-agritech.vercel.app,https://*.vercel.app,https://*.onrender.com`
4. Render will trigger a quick zero-downtime redeploy with updated CORS/CSRF headers.

---

## 🧪 STEP 5: End-to-End Production Verification Checklist

Run through these 12 validation checks on your live production URL:

- [ ] **1. Public URL & Homepage:** Visit your Vercel URL over HTTPS. Hero section, features, stats, and footer load with zero console errors.
- [ ] **2. Direct Route Navigation & Refresh:** Directly open `https://<your-vercel-domain>/login` and press `F5` / Refresh. The page loads without 404 (verifying `vercel.json` SPA rewrite).
- [ ] **3. User Registration:** Click **Register** → Create a new Farmer account with a phone number and password. Verification succeeds and redirects to Farmer dashboard.
- [ ] **4. User Authentication:** Log out and log back in. Auth token persists in `localStorage` and request headers.
- [ ] **5. Farmer Dashboard & Requests:** Open **Service Requests** → Click **"New Request"** → Post a request for *Tractor Mechanic* or *Machinery Rental*. Record saves into PostgreSQL database.
- [ ] **6. Provider Matching:** Log in as a provider or review matched providers. Nearby providers with matching category and village radius are returned.
- [ ] **7. Quotations Workflow:** Submit a quote as a provider → Switch to Farmer view → Quote displays with amount and price breakdown.
- [ ] **8. Booking Confirmation:** Farmer accepts quotation → Booking moves to `pending_confirmation` → Provider confirms → Backend double-booking prevention validates calendar and transitions status to `confirmed`.
- [ ] **9. Farm Project Manager (Core USP):** Open **Farm Projects** → View *Wheat Harvesting 2026* → Overall readiness calculation, budget vs actual cost, and status update dynamically.
- [ ] **10. Multilingual Toggle:** Toggle between **हिंदी** and **EN** in the navbar. Hindi translations and Devanagari font render cleanly across all cards.
- [ ] **11. Cinematic Intro:** Click **"Replay Cinematic Intro"** in footer or landing page. Animation runs smoothly, can be skipped via Escape / skip button, and respects `prefers-reduced-motion`.
- [ ] **12. Responsive Mobile Layout:** Inspect site with mobile device emulation (375px / 414px width). Bottom navigation, menus, and modals fit cleanly on screen.

---

## 🔄 STEP 6: Future Updates Workflow

Whenever you make improvements or fix bugs:

```powershell
# 1. Check changed files
git status

# 2. Stage changes
git add .

# 3. Commit with a meaningful description
git commit -m "feat: enhance farm project tracking"

# 4. Push to GitHub
git push origin main
```

- **Vercel** will detect the commit to `frontend/` and automatically redeploy the frontend in seconds.
- **Render** will detect changes to `backend/` and trigger an automated build, collectstatic, migration, and rolling server restart.
