# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pandora Beauty Salon Booking System - A Next.js 14 application for managing beauty salon appointments with admin dashboard, analytics, and customer booking features. Built with TypeScript, Supabase (PostgreSQL + Auth), and Tailwind CSS.

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

**Note:** No test infrastructure exists yet. See `TEST_COVERAGE_ANALYSIS.md` and `TESTING_ROADMAP.md` for test implementation plans.

## Architecture

### Next.js 14 App Router Structure

- **`app/`** - Next.js App Router pages and layouts
  - `app/page.tsx` - Public home page
  - `app/auth/` - Login and registration pages
  - `app/booking/` - Customer booking flow
  - `app/account/` - User account management
  - `app/admin/` - Protected admin panel (requires `is_admin` role)
  - `app/api/` - API routes organized by feature
    - `api/analytics/` - Analytics endpoints (summary, detailed, export)
    - `api/bookings/` - Booking CRUD operations
    - `api/check-availability/` - Real-time availability checking
    - `api/auth/` - Authentication operations

- **`components/`** - React components (Manager components and UI elements)
  - Manager components: `AdminDashboard`, `StaffManager`, `ServiceManager`, `AppointmentManager`, etc.
  - Booking: `SinglePageBookingForm` (1,074 LOC - complex form logic)
  - Analytics: `AnalyticsDashboardWidget`, `AnalyticsInsights`, `AnalyticsComponents`

- **`lib/`** - Utilities and business logic
  - `lib/supabase/` - Database client factories
  - `lib/analytics/engine.ts` - Analytics computation engine (411 LOC)
  - `lib/auth-helpers.ts` - Authentication utility functions

### Supabase Integration Patterns

**Two separate client factories must be used correctly:**

1. **Server Components & API Routes**: Use `lib/supabase/server.ts`
   ```typescript
   import { createClient } from '@/lib/supabase/server'
   const supabase = createClient()
   ```

2. **Client Components**: Use `lib/supabase/client.ts`
   ```typescript
   import { createClient } from '@/lib/supabase/client'
   const supabase = createClient()
   ```

Both use `@supabase/ssr` for session management via cookies. The middleware in `middleware.ts` refreshes sessions on every request.

### Authentication & Authorization

**Middleware Protection** (`middleware.ts`):
- Intercepts all `/admin/*` routes
- Validates session and checks `profiles.is_admin` flag
- Redirects unauthenticated users to `/auth/login`
- Redirects non-admin users to home page

**Helper Functions** (`lib/auth-helpers.ts`):
- `requireAuth()` - Redirects to login if not authenticated (use in Server Components)
- `requireAdmin()` - Redirects to home if not admin (use in admin pages)
- `getOptionalUser()` - Returns user or null without redirecting (safe for optional auth)

**Usage Pattern:**
```typescript
// In admin page.tsx
import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminPage() {
  await requireAdmin() // Redirects if not admin
  // ... rest of component
}
```

### Analytics Engine Architecture

**Core Module:** `lib/analytics/engine.ts`

The `AnalyticsEngine` class provides business intelligence calculations:
- **Revenue Metrics**: Total revenue, AOV, growth rate, daily averages
- **Customer Metrics**: Total/new/returning customers, retention rate, LTV
- **Operational Metrics**: Appointments, completion rate, cancellation rate, utilization
- **Service Performance**: Bookings, revenue, efficiency per service
- **Staff Performance**: Appointments, revenue, completion rate per staff member

**API Endpoints:**
- `/api/analytics` - Basic metrics
- `/api/analytics/summary` - Real-time dashboard metrics (auto-refreshes every 5 min)
- `/api/analytics/detailed` - Advanced segmentation and trends
- `/api/analytics/export` - CSV/JSON data export

**Usage:**
```typescript
import { AnalyticsEngine } from '@/lib/analytics/engine'

const engine = new AnalyticsEngine()
const metrics = await engine.getRevenueMetrics({ startDate, endDate })
```

See `BUSINESS_INTELLIGENCE.md` for feature documentation.

## Database Schema (Supabase/PostgreSQL)

**Core Tables:**

- **`profiles`** - User profiles (extends `auth.users`)
  - `id` (uuid, FK to auth.users)
  - `full_name`, `phone`
  - `is_admin` (boolean) - Controls admin access

- **`service_categories`** / **`services`**
  - Services have category, duration, price, active status

- **`product_categories`** / **`products`**
  - Products for add-ons during booking

- **`staff_categories`** / **`staff`**
  - Staff management with categories (added post-launch)

- **`time_slots`**
  - Available booking times with active status

- **`appointments`**
  - Booking records with customer info, service, date/time
  - `status` field: 'pending', 'confirmed', 'completed', 'cancelled'
  - `user_id` (nullable) - Links to registered users or null for guest bookings

- **`appointment_products`**
  - Junction table for products added to appointments

**Full schema details in `README.md` (lines 81-141).**

## Environment Variables

Required in `.env.local` (see `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Both variables must be public (`NEXT_PUBLIC_*`) as they're used in client components.

## Key Features

### Customer Features
- Registration/login with Supabase Auth
- Single-page booking form with real-time availability checking
- Service selection with categories
- Product add-ons during booking
- Appointment history in account page

### Admin Features
- Dashboard with real-time analytics widget (auto-refresh)
- CRUD management for:
  - Services and service categories
  - Products and product categories
  - Staff and staff categories
  - Time slots
  - Appointments
- Business Intelligence reports (`/admin/reports`, `/admin/advanced-reports`)
- Data export functionality (CSV/JSON)
- Health check tools (`/admin/health-check`)

## Important Patterns

### Form Handling
Uses `react-hook-form` for complex forms. See `SinglePageBookingForm.tsx` for reference implementation.

### Date Handling
Uses `date-fns` library for date operations throughout the codebase.

### Styling
Tailwind CSS with custom configuration in `tailwind.config.js`. Components use utility classes.

### TypeScript Configuration
Path alias `@/*` maps to root directory (configured in `tsconfig.json`).

## Known Issues & Documentation

- **Testing**: Zero test coverage - see `TESTING_ROADMAP.md` for implementation plan
- **Analytics Troubleshooting**: See `ANALYTICS_TROUBLESHOOTING.md`
- **Mobile Fixes**: See `MOBILE_FIXES.md` for responsive design implementations
- **Feature Docs**: See `docs/` directory for detailed feature documentation

## Critical Code Areas

**High-risk untested code:**
1. `middleware.ts` - Authentication/authorization (security-critical)
2. `lib/analytics/engine.ts` - Financial calculations (411 LOC)
3. `app/api/bookings/route.ts` - Booking operations (revenue-critical)
4. `app/api/check-availability/route.ts` - Prevents double-booking

**When modifying these areas, exercise extreme caution as they lack test coverage.**
