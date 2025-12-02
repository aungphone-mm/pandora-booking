# Session Tracking System

## Overview

The Pandora Booking System now includes comprehensive session tracking to monitor user visits, device information, and usage patterns.

## Features

### Automatically Tracked Data

**Device Information:**
- Device type (mobile, tablet, desktop)
- Device model (iPhone, Samsung Galaxy, etc.)
- Screen resolution
- Viewport size

**Browser & OS:**
- Browser name and version (Chrome, Safari, Firefox, Edge)
- Operating system and version (iOS, Android, Windows, macOS)
- Platform information

**User Information:**
- User ID (if logged in)
- User email and name (if logged in)
- Guest vs registered user tracking

**Session Details:**
- Session start and end times
- Session duration
- Page URLs visited
- Referrer (where user came from)
- Timezone and language settings

## Setup Instructions

### 1. Create Database Table

Run the SQL migration in Supabase:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Run the contents of:
database/migrations/create_user_sessions_table.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 2. Enable RLS Policies

The migration automatically creates Row Level Security policies:
- Users can insert their own sessions
- Users can view their own sessions
- Admins can view all sessions

### 3. Test the Tracking

1. Visit your website (any page)
2. Session tracking starts automatically
3. Go to `/admin/sessions` to view analytics

## Usage

### Automatic Tracking

Session tracking happens automatically on every page visit through the `SessionTrackingProvider` in `app/layout.tsx`.

### Manual Tracking

You can also manually track events:

```typescript
import { trackSession, trackPageView } from '@/lib/tracking/sessionTracker'

// Track a new session
const sessionId = await trackSession({
  userId: user?.id,
  userEmail: user?.email,
  userName: user?.name
})

// Track page view
await trackPageView('booking-page')
```

### Using the Hook

```typescript
import { useSessionTracking } from '@/hooks/useSessionTracking'

function MyComponent() {
  const { sessionId, trackPageView } = useSessionTracking()

  // Track specific page
  useEffect(() => {
    trackPageView('custom-page')
  }, [])

  return <div>Session ID: {sessionId}</div>
}
```

## Admin Dashboard

### Viewing Analytics

Navigate to: **`/admin/sessions`**

**Features:**
- Total sessions count
- Mobile vs Desktop breakdown
- Browser usage statistics
- Operating system distribution
- Registered vs Guest users
- Recent sessions table
- Timeframe filtering (Today, 7 days, 30 days, All time)

### Analytics Breakdown

**Device Analytics:**
- Mobile percentage
- Tablet usage
- Desktop sessions

**Browser Stats:**
- Chrome, Safari, Firefox, Edge usage
- Browser version tracking

**OS Distribution:**
- iOS, Android, Windows, macOS
- Version information

**User Insights:**
- Registered user sessions
- Guest visitor sessions
- User names and emails

## Privacy & Security

### Data Collection

**What we collect:**
- ✅ Device type and browser (from user agent)
- ✅ Session timestamps
- ✅ Page URLs visited
- ✅ Timezone and language
- ✅ Screen resolution

**What we DON'T collect:**
- ❌ Exact GPS location
- ❌ Personal files or data
- ❌ Camera or microphone access
- ❌ Contact lists

### Security Features

**Row Level Security (RLS):**
- Users can only see their own sessions
- Admins can see all sessions
- Automatic data isolation

**Data Retention:**
- Sessions are kept indefinitely by default
- Add cleanup queries to delete old sessions if needed

### GDPR Compliance

**User Rights:**
- Users can view their own session data
- Add deletion endpoint if required for GDPR
- Session data linked to user accounts

**Recommended Privacy Policy:**
Include in your privacy policy:
- Device information collection
- Browser and OS tracking
- Session duration monitoring
- Purpose: Analytics and service improvement

## Technical Details

### Files Created

**Database:**
- `database/migrations/create_user_sessions_table.sql` - Table schema

**Utilities:**
- `lib/tracking/sessionTracker.ts` - Core tracking functions
- `hooks/useSessionTracking.ts` - React hook for components

**Components:**
- `components/SessionTrackingProvider.tsx` - Auto-tracking wrapper
- `components/SessionAnalyticsDashboard.tsx` - Admin analytics UI

**Pages:**
- `app/admin/sessions/page.tsx` - Analytics dashboard page

**Modified:**
- `app/layout.tsx` - Added SessionTrackingProvider

### Database Schema

```sql
Table: user_sessions

Columns:
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to auth.users
- user_email (TEXT)
- user_name (TEXT)
- session_start (TIMESTAMPTZ)
- session_end (TIMESTAMPTZ)
- duration_seconds (INTEGER)
- device_info (JSONB) - Full device details
- user_agent (TEXT)
- browser_name (TEXT)
- os_name (TEXT)
- device_type (TEXT)
- device_model (TEXT)
- screen_resolution (TEXT)
- timezone (TEXT)
- language (TEXT)
- page_url (TEXT)
- referrer (TEXT)
- is_mobile (BOOLEAN)
- is_tablet (BOOLEAN)
- is_desktop (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### API Functions

**Core Functions:**

```typescript
// Get device information
getDeviceInfo(): DeviceInfo

// Track new session
trackSession(userData?): Promise<string | null>

// End session
endSession(sessionId?): Promise<void>

// Track page view
trackPageView(pageName: string): Promise<void>

// Get analytics
getSessionAnalytics(timeframe): Promise<AnalyticsData>
```

## Troubleshooting

### Sessions Not Appearing

1. **Check database table exists:**
   - Go to Supabase Dashboard > Table Editor
   - Verify `user_sessions` table exists

2. **Check RLS policies:**
   - Ensure policies are enabled
   - Test with admin user

3. **Check browser console:**
   - Look for tracking errors
   - Verify SessionTrackingProvider is rendered

### Analytics Not Loading

1. **Verify admin access:**
   - User must have `is_admin = true` in profiles table

2. **Check date range:**
   - Try "All Time" filter
   - Verify sessions exist in database

3. **Browser permissions:**
   - Some browsers block tracking in incognito mode
   - Check if third-party cookies are enabled

## Future Enhancements

**Possible Improvements:**
- IP geolocation (city/country)
- Heatmap of page clicks
- User journey tracking
- Conversion funnel analysis
- A/B testing support
- Real-time visitor counter
- Session replay (with privacy controls)
- Export to CSV/PDF

## Example Queries

### Get Today's Mobile Sessions

```sql
SELECT *
FROM user_sessions
WHERE DATE(created_at) = CURRENT_DATE
AND is_mobile = true
ORDER BY created_at DESC;
```

### Browser Market Share

```sql
SELECT browser_name, COUNT(*) as sessions
FROM user_sessions
GROUP BY browser_name
ORDER BY sessions DESC;
```

### Average Session Duration

```sql
SELECT AVG(duration_seconds) as avg_duration_seconds
FROM user_sessions
WHERE duration_seconds IS NOT NULL;
```

### Top Devices

```sql
SELECT device_model, COUNT(*) as count
FROM user_sessions
WHERE device_model IS NOT NULL AND device_model != ''
GROUP BY device_model
ORDER BY count DESC
LIMIT 10;
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database table exists
3. Review RLS policies
4. Check this documentation

---

**Note:** This tracking system respects user privacy and complies with standard web analytics practices. Always inform users about data collection in your privacy policy.
