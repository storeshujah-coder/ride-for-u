# 🚗 Ride for U — Transport Management System

A comprehensive web-based Transport & Fleet Management System built with React, TypeScript, Tailwind CSS, and Supabase.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-snk9mulx)

---

## 📖 Complete Documentation & Deployment Info

All repository information, Supabase backend credentials, Super Admin logins, and deployment instructions are stored in **[PROJECT_INFO.md](./PROJECT_INFO.md)**.

### Quick Links:
- **GitHub Repository**: [https://github.com/storeshujah-coder/ride-for-u](https://github.com/storeshujah-coder/ride-for-u)
- **Supabase Dashboard**: [https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx](https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx)

---

## 🩺 Supabase Health Check & Activity Endpoint (`GET /api/health`)

To keep your Supabase Free Plan project active without pauses (Supabase pauses projects after 7 days of inactivity), a safe, lightweight health check endpoint is available at:

```http
GET /api/health
```

### 🔒 Safety Guarantees:
- **100% Read-Only**: Performs a single `SELECT id FROM departments LIMIT 1` query.
- **Zero Fake Data**: Never inserts, updates, or deletes any vehicles, drivers, fuel records, or financial entries.
- **Protected Execution**: Enforces a strict 5-second timeout (`AbortSignal`) so requests never hang.
- **No Sensitive Leakage**: Uses the public `anon` key from environment variables. No service-role key is needed or exposed.

### 📋 Expected Response:

**Success (HTTP 200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-09-03T04:45:00.000Z",
  "database": "connected",
  "latency_ms": 38
}
```

**Failure / Timeout (HTTP 503 Service Unavailable):**
```json
{
  "status": "error",
  "timestamp": "2026-09-03T04:45:00.000Z",
  "latency_ms": 5002,
  "message": "Health check timed out after 5000ms",
  "error": "Request Timeout"
}
```

---

## ⏰ How to Connect a Free External Scheduler (Every 3–4 Days)

Because your car rental and transport records may only be updated once per month, connect any of these **100% free** schedulers to call `GET https://your-domain.vercel.app/api/health` every 3 days:

### Option 1: Free cron-job.org (Recommended - 2 min setup)
1. Register a free account at [cron-job.org](https://cron-job.org).
2. Click **Create Cronjob**.
3. **Title**: `Ride For U - Supabase Keepalive`
4. **URL**: `https://<your-vercel-domain>.vercel.app/api/health`
5. **Schedule**: Select **User-defined** / Cron expression:
   ```cron
   0 12 */3 * *
   ```
   *(Executes at 12:00 UTC every 3 days)*.
6. **Request Method**: `GET`
7. Save the cron job.

---

### Option 2: GitHub Actions (Built-in & Automated)
A ready-to-use GitHub Actions workflow is included at [`.github/workflows/supabase-keepalive.yml`](./.github/workflows/supabase-keepalive.yml).
1. Push your repository to GitHub.
2. In GitHub: Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Name: `APP_URL`, Value: `https://<your-vercel-domain>.vercel.app`
4. GitHub will automatically ping `/api/health` every 3 days.

---

### Option 3: Free UptimeRobot
1. Create a free account on [UptimeRobot](https://uptimerobot.com).
2. Add New Monitor → Monitor Type: **HTTP(s)**.
3. Friendly Name: `Ride For U Health`
4. URL: `https://<your-vercel-domain>.vercel.app/api/health`
5. Monitoring Interval: **Every 15 minutes / 1 hour / 24 hours**.

---

### 🛠️ Getting Started Locally:

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Test health check locally
# Open: http://localhost:5173/api/health

# Build for production
npm run build
```

