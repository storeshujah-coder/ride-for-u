# 🚗 Ride for U — Project Documentation & Credentials

This file contains all critical project metadata, repository details, backend configuration, credentials, and deployment settings.

---

## 📌 1. GitHub Repository Details

| Field | Detail |
|---|---|
| **Repository URL** | [https://github.com/storeshujah-coder/ride-for-u](https://github.com/storeshujah-coder/ride-for-u) |
| **GitHub Account / Owner** | `storeshujah-coder` |
| **Default Branch** | `main` |
| **Repository Type** | Public / Private Git Repository |

---

## 🗄️ 2. Supabase Backend & Database

| Field | Detail |
|---|---|
| **Project Reference ID** | `sgldyuhydllvqrroqnnx` |
| **Supabase Dashboard** | [https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx](https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx) |
| **Supabase URL** | `https://sgldyuhydllvqrroqnnx.supabase.co` |
| **Supabase Anon Public Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbGR5dWh5ZGxsdnFycm9xbm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDQ3NjksImV4cCI6MjEwMjUyMDc2OX0.OzxWbykegMLNU47kIaXwy3nogorIJWP9grbzPyWsyj4` |
| **SQL Editor** | [https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx/sql](https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx/sql) |
| **Auth & Email Templates** | [https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx/auth/templates](https://supabase.com/dashboard/project/sgldyuhydllvqrroqnnx/auth/templates) |

---

## 🔑 3. Default Super Admin Credentials

| Field | Detail |
|---|---|
| **Name** | Muhammad Ijaz |
| **Super Admin Email** | `mijaztransport1@gmail.com` |
| **Initial Password** | `ijaz123` |
| **Role** | `super_admin` (Full Master Access across all modules) |

---

## 🚀 4. Deployment & Hosting Configuration

| Platform | Details |
|---|---|
| **Vercel / Netlify Configuration** | Configured with `vercel.json` (SPA routing rewrite to `/index.html`) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Node Version** | Node.js 18+ / 20+ |
| **Environment Variables Required** | `VITE_SUPABASE_URL`<br>`VITE_SUPABASE_ANON_KEY` |
| **Bolt Origin Template** | [https://bolt.new/~/sb1-snk9mulx](https://bolt.new/~/sb1-snk9mulx) |

---

## 💻 5. Local Development Commands

```bash
# Install dependencies
npm install

# Run local development server (http://localhost:5173)
npm run dev

# Run production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 6. Database SQL Scripts & Migrations

Located in `supabase/`:

1. **`supabase/migrations/0001_ride_for_u_schema.sql`**
   - Full database schema: tables (`profiles`, `vehicles`, `drivers`, `subcontractors`, `monthly_records`, `daily_records`, `daily_routes`, `expenses`, `driver_salaries`, `activity_logs`, `settings`).
2. **`supabase/migrations/0002_notifications_system.sql`**
   - Live real-time notification bell table, security policies, and realtime broadcast replication.
3. **`supabase/fix_auth_and_permissions.sql`**
   - Master sync script for departments, password reset RPCs, role permissions, and user credentials.

---

## ⚡ 7. Core Application Features

- **Dashboard**: Live financial KPIs, monthly profit & loss, company billing, contractor payouts, and driver expense metrics.
- **Vehicles Management**: Owned vs Subcontractor fleet tracking, maintenance records, and assignments.
- **Drivers & Subcontractors**: Complete profiles, CNIC, licenses, salary ledgers, and subcontract payouts.
- **Monthly & Daily Duty Ledger**: Slabs calculation, daily mileage logs, multi-route support, and department billing.
- **Business Expenses & Salaries**: Categorized expenses, payment methods, and automated payroll calculations.
- **Reports & Invoicing**: Print-optimized (1-page fit) statement generator for vehicles, drivers, subcontractors, and profit summaries.
- **User Management & RBAC**: Super Admin vs Staff granular permission controls (View, Add, Edit, Delete per module).
- **Live Notifications**: 0ms cross-tab sync, Supabase Realtime WebSockets, Web Audio API sound chime, and bell ringing animations.
- **Password Reset & Recovery**: Direct email reset link and 6-digit OTP verification support.

---
*Created on: 2026-08-21 | Maintained by: Ride for U Team*
