# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pandora Beauty Salon Booking System - A Next.js 14 application for managing beauty salon appointments with admin dashboard, analytics, and customer booking features. Built with TypeScript, Supabase (PostgreSQL + Auth), and Tailwind CSS.

## Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18.2
- TypeScript 5.3
- Tailwind CSS 3.4
- React Hook Form 7.57

**Backend & Database:**
- Supabase (PostgreSQL + Auth)
- @supabase/ssr 0.1.0 (Server-side rendering)
- @supabase/supabase-js 2.39.0

**PWA & Performance:**
- next-pwa 5.6.0 (Progressive Web App)
- Sharp 0.34.5 (Image optimization)

**Utilities:**
- date-fns 4.1.0 (Date manipulation)

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build (required for PWA features)
npm run build

# Start production server
npm start
```

**Note:** No test infrastructure exists yet. See `TEST_COVERAGE_ANALYSIS.md` and `TESTING_ROADMAP.md` for test implementation plans.

**PWA Note:** Progressive Web App features (service workers, offline mode, installability) only work in production builds. Use `npm run build && npm start` to test PWA functionality locally.

## Architecture

### Next.js 14 App Router Structure

- **`app/`** - Next.js App Router pages and layouts
  - `app/page.tsx` - Public home page
  - `app/auth/` - Authentication pages (login, register, forgot-password, reset-password)
  - `app/booking/` - Customer booking flow
  - `app/account/` - User account management
  - `app/admin/` - Protected admin panel (requires `is_admin` role)
    - `/admin/sessions` - Session tracking analytics dashboard
    - `/admin/reports` - Business Intelligence reports
    - `/admin/advanced-reports` - Advanced analytics
    - `/admin/health-check` - Database health monitoring
  - `app/api/` - API routes organized by feature
    - `api/analytics/` - Analytics endpoints (summary, detailed, export)
    - `api/bookings/` - Booking CRUD operations (create, search)
    - `api/check-availability/` - Real-time availability checking
    - `api/auth/` - Authentication operations
    - `api/sessions/` - Session tracking endpoints
    - `api/gallery/` - Gallery photo management and reordering

- **`components/`** - React components (Manager components and UI elements)
  - Manager components: `AdminDashboard`, `StaffManager`, `ServiceManager`, `AppointmentManager`, etc.
  - Booking: `SinglePageBookingForm` (1,074 LOC - complex form logic)
  - Analytics: `AnalyticsDashboardWidget`, `AnalyticsInsights`, `AnalyticsComponents`
  - Session Tracking: `SessionTrackingProvider`, `SessionAnalyticsDashboard`
  - PWA: `InstallPWA` - Progressive Web App install prompt component

- **`lib/`** - Utilities and business logic
  - `lib/supabase/` - Database client factories
  - `lib/analytics/engine.ts` - Analytics computation engine (410 LOC)
  - `lib/auth-helpers.ts` - Authentication utility functions
  - `lib/tracking/sessionTracker.ts` - Session tracking and device detection

- **`hooks/`** - Custom React hooks
  - `hooks/useSessionTracking.ts` - Client-side session tracking hook

- **`database/`** - Database schemas and migrations
  - `database/migrations/` - SQL migration files
    - `create_user_sessions_table.sql` - Session tracking table schema

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

### Session Tracking System

**Core Module:** `lib/tracking/sessionTracker.ts`

The application includes comprehensive session tracking to monitor user behavior and device analytics:

**Tracked Data:**
- **Device Information**: Device type (mobile/tablet/desktop), model, screen resolution
- **Browser & OS**: Browser name/version, operating system, platform details
- **User Information**: User ID (for authenticated users), email, name, guest vs registered
- **Session Details**: Start/end times, duration, page URLs, referrer, timezone, language

**Components:**
- `SessionTrackingProvider` - Automatic session tracking wrapper (in `app/layout.tsx`)
- `SessionAnalyticsDashboard` - Admin UI for viewing session analytics
- `useSessionTracking` hook - Client-side tracking integration

**Admin Dashboard:**
- Navigate to `/admin/sessions` to view analytics
- Features: Device breakdown, browser stats, OS distribution, user insights
- Filtering by timeframe (Today, 7 days, 30 days, All time)

**Database:**
- Table: `user_sessions` with full device/browser metadata stored as JSONB
- Row Level Security: Users see their own sessions, admins see all
- Migration file: `database/migrations/create_user_sessions_table.sql`

**Privacy & Security:**
- RLS policies ensure data isolation
- No GPS location, personal files, or sensitive data collected
- GDPR-ready architecture (see `SESSION_TRACKING.md` for details)

**Usage:**
```typescript
import { trackSession, trackPageView } from '@/lib/tracking/sessionTracker'
import { useSessionTracking } from '@/hooks/useSessionTracking'

// Automatic tracking via SessionTrackingProvider in app/layout.tsx
// Manual tracking:
const sessionId = await trackSession({ userId, userEmail, userName })
await trackPageView('page-name')
```

See `docs/SESSION_TRACKING.md` for complete documentation.

### Progressive Web App (PWA) Features

**Core Configuration:** `next.config.js` with `next-pwa`

The application is a fully installable Progressive Web App:

**Features:**
- **Installable**: Users can install on home screen (Android/iOS)
- **Offline Support**: Network-first caching strategy with offline fallback page
- **App Manifest**: `/public/manifest.json` with app metadata
- **Service Worker**: Auto-generated by next-pwa (disabled in development)
- **Install Prompt**: Smart prompt component (`InstallPWA`) appears after 3 seconds
- **App Shortcuts**: Quick access to "Book Appointment" and "My Appointments"

**Assets:**
- Icons: 8 sizes (72px to 512px) in `/public/icons/`
- Source: `/public/icon.svg`
- Offline page: `/public/offline.html`
- Generation script: `generate-icons.js`

**Configuration:**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [{
    urlPattern: /^https?.*/,
    handler: 'NetworkFirst',
    options: { cacheName: 'offlineCache', expiration: { maxAgeSeconds: 86400 } }
  }]
})
```

**Testing PWA:**
1. Build production: `npm run build && npm start`
2. Test on HTTPS (required for PWA, except localhost)
3. Check DevTools → Application → Manifest & Service Workers
4. Use Lighthouse audit for PWA score

**Important:** PWA features only work in production builds and require HTTPS (localhost exempt).

See `PWA_SETUP.md` for complete setup guide.

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
  - `service_id` (nullable, legacy) - Now uses `appointment_services` junction table

- **`appointment_services`**
  - Junction table for multiple services per appointment (new schema)
  - `appointment_id`, `service_id`, `price` (captured at booking time), `quantity`
  - Allows booking multiple services in a single appointment
  - Migration: `add_multiple_services_support.sql`

- **`appointment_products`**
  - Junction table for products added to appointments

- **`user_sessions`** (Session Tracking)
  - Session tracking data with device and browser analytics
  - `device_info` (JSONB) - Complete device metadata
  - `user_id` (nullable) - Links to registered users or null for guest sessions
  - Includes: browser_name, os_name, device_type, screen_resolution, timezone, etc.
  - See `database/migrations/create_user_sessions_table.sql` for full schema

- **`gallery_photos`** (Gallery Management)
  - Photos for salon gallery display
  - `image_url`, `caption`, `display_order`, `is_active`
  - Admin-managed, publicly viewable
  - Migration: `create_gallery_photos_table.sql`

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
- Forgot password / password reset flow
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
- **Analytics**: See `BUSINESS_INTELLIGENCE.md` for analytics features
- **Analytics Troubleshooting**: See `ANALYTICS_TROUBLESHOOTING.md`
- **Session Tracking**: See `docs/SESSION_TRACKING.md` for complete tracking system documentation
- **Password Reset**: See `docs/PASSWORD_RESET_SETUP.md` for forgot password configuration and troubleshooting
- **PWA Setup**: See `PWA_SETUP.md` for Progressive Web App installation and configuration
- **Mobile Fixes**: See `MOBILE_FIXES.md` for responsive design implementations
- **Admin UI Enhancements**: See `docs/ENHANCED_ADMIN_PAGES.md` for UI/UX improvements
- **Feature Docs**: See `docs/` directory for additional detailed feature documentation
  - `ADMIN_PANEL_IMPROVEMENTS.md` - Admin panel enhancements
  - `APPOINTMENTS_PAGE_ENHANCEMENTS.md` - Appointment management improvements

## Critical Code Areas

**High-risk untested code:**
1. `middleware.ts` - Authentication/authorization (security-critical, 95 LOC)
2. `lib/analytics/engine.ts` - Financial calculations (410 LOC)
3. `app/api/bookings/route.ts` - Booking operations (revenue-critical, handles multiple services)
4. `app/api/check-availability/route.ts` - Prevents double-booking
5. `lib/tracking/sessionTracker.ts` - Session tracking and device detection (privacy-sensitive)

**Important Schema Migration:**
- The system migrated from single-service to multiple-services per appointment
- Legacy `appointments.service_id` remains for backward compatibility but is nullable
- New bookings use `appointment_services` junction table
- Price is captured at booking time for historical accuracy

**When modifying these areas, exercise extreme caution as they lack test coverage.**

## Important Development Guidelines

### When Adding New Features

1. **Database Changes**:
   - Create migration files in `database/migrations/`
   - Use RLS policies for data security
   - Document schema changes in this file

2. **Admin Pages**:
   - Must use `requireAdmin()` helper from `lib/auth-helpers.ts`
   - Follow existing UI patterns (see `docs/ENHANCED_ADMIN_PAGES.md`)
   - Consider mobile responsive design

3. **API Routes**:
   - Always use appropriate Supabase client factory (`lib/supabase/server.ts`)
   - Implement proper error handling
   - Validate input data
   - Check user authentication/authorization

4. **Client Components**:
   - Use `lib/supabase/client.ts` for Supabase
   - Implement loading states
   - Handle errors gracefully
   - Consider offline PWA scenarios

5. **Session Tracking**:
   - Automatic tracking via `SessionTrackingProvider` in `app/layout.tsx`
   - Respect user privacy (see privacy guidelines in `SESSION_TRACKING.md`)
   - Ensure GDPR compliance for data collection

6. **PWA Considerations**:
   - Test offline functionality
   - Ensure icons are properly sized
   - Update manifest.json if adding new routes/shortcuts
   - Test install experience on mobile devices

## Quick Reference

### Common Code Patterns

**Creating an Admin Page:**
```typescript
// app/admin/my-page/page.tsx
import { requireAdmin } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'

export default async function MyAdminPage() {
  await requireAdmin() // Security check
  const supabase = createClient()

  // Fetch data...
  const { data } = await supabase.from('table_name').select('*')

  return <div>{/* Component JSX */}</div>
}
```

**Creating an API Route:**
```typescript
// app/api/my-endpoint/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle request...
  return NextResponse.json({ data: 'result' })
}
```

**Using Session Tracking:**
```typescript
// In a client component
import { useSessionTracking } from '@/hooks/useSessionTracking'

export default function MyComponent() {
  const { sessionId, trackPageView } = useSessionTracking()

  useEffect(() => {
    trackPageView('my-page')
  }, [])

  return <div>Session ID: {sessionId}</div>
}
```

**Database Query with RLS:**
```typescript
// Server component
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// RLS automatically filters by user
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', user.id)
```

### Useful Commands

```bash
# Database migrations (if using Supabase CLI)
supabase db push

# Generate PWA icons (after updating icon.svg)
node generate-icons.js

# Production build and test
npm run build && npm start

# Check for TypeScript errors
npx tsc --noEmit

# Format code (if using prettier)
npx prettier --write .
```

### Directory Navigation

| Path | Purpose |
|------|---------|
| `/app/admin/*` | Admin panel pages (protected) |
| `/app/api/*` | API endpoints |
| `/app/booking` | Customer booking flow |
| `/components/*` | Reusable React components |
| `/lib/supabase/` | Database client factories |
| `/lib/analytics/` | Analytics engine |
| `/lib/tracking/` | Session tracking |
| `/hooks/*` | Custom React hooks |
| `/database/migrations/` | SQL migration files |
| `/public/` | Static assets (icons, manifest) |
| `/docs/` | Feature documentation |
