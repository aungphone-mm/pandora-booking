# Payroll System - Quick Setup Guide

## 🚀 Getting Started

Follow these steps to set up the Hybrid Payroll System for your Pandora Beauty Salon.

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the migration file: `database/migrations/create_payroll_system.sql`
4. Copy the entire contents
5. Paste into SQL Editor and click **Run**

This creates:
- ✅ 8 new tables (compensation profiles, tiers, bonuses, payroll records)
- ✅ Default compensation profiles (4 options)
- ✅ Default performance tiers (Bronze, Silver, Gold, Platinum)
- ✅ Row Level Security policies
- ✅ Indexes for performance

## Step 2: Assign Compensation Profiles to Staff

All staff default to "Balanced" profile. To customize:

**Option A - Via Supabase Dashboard:**
1. Go to **Table Editor** → `staff` table
2. Find staff member
3. Set `compensation_profile_id` to desired profile UUID
4. Set `skill_premium_hourly` (e.g., 3.00 for certified specialists)

**Option B - Via SQL:**
```sql
-- Get profile UUIDs
SELECT id, name FROM compensation_profiles;

-- Update staff member
UPDATE staff
SET
  compensation_profile_id = 'uuid-of-commission-heavy-profile',
  skill_premium_hourly = 3.00
WHERE full_name = 'Staff Name';
```

## Step 3: Test the System

### Calculate First Payroll

1. **Navigate to Admin Dashboard**: `http://localhost:3000/admin/payroll`
2. **Select Period**: Choose current month/year
3. **Click "Calculate Payroll"**
4. **Review Results**: Check calculated commissions, bonuses, and net pay

### Add a Custom Bonus

1. Click **"+ Add Bonus"** button
2. Select staff member from dropdown
3. Choose bonus type (e.g., "Custom")
4. Enter amount: `100.00`
5. Description: `"Excellent customer service this month"`
6. Click **"Add Bonus"**
7. Recalculate payroll to see bonus applied

### View Staff Earnings

1. **Navigate to**: `http://localhost:3000/admin/staff-earnings`
2. Select staff member from dropdown
3. View earnings history and breakdown
4. Click **"Export CSV"** to download data

## Step 4: Add Navigation Links

Update your admin navigation to include payroll pages.

**File**: `app/admin/layout.tsx` (or your navigation component)

```tsx
<Link
  href="/admin/payroll"
  className="nav-link"
>
  💰 Payroll Management
</Link>

<Link
  href="/admin/staff-earnings"
  className="nav-link"
>
  📊 Staff Earnings
</Link>
```

## Step 5: Configure Advanced Features (Optional)

### Service Commission Multipliers

Set higher commission rates for premium services:

```sql
-- Example: 1.5x commission for Balayage service
INSERT INTO service_commission_multipliers (service_id, multiplier, description)
SELECT
  id,
  1.50,
  'Premium service - higher commission'
FROM services
WHERE name = 'Balayage';
```

### Team Bonuses

Create salon-wide goals:

```sql
INSERT INTO team_bonuses (
  name,
  description,
  bonus_type,
  target_value,
  bonus_amount,
  distribution_method,
  period_start,
  period_end
) VALUES (
  'January Revenue Goal',
  'Reach $50,000 in monthly revenue',
  'revenue_target',
  50000.00,
  1000.00, -- $1,000 split among staff
  'equal', -- Split equally
  '2025-01-01',
  '2025-01-31'
);
```

**Mark as Achieved** (when goal is met):
```sql
UPDATE team_bonuses
SET
  is_achieved = true,
  achieved_at = NOW()
WHERE name = 'January Revenue Goal';
```

## Monthly Workflow

### End of Month Process

1. **Calculate Payroll** (first week of new month):
   - Go to `/admin/payroll`
   - Select previous month
   - Click "Calculate Payroll"
   - System auto-calculates everything

2. **Review Records**:
   - Check each staff member's breakdown
   - Verify hours, commissions, bonuses
   - Add any missing custom bonuses

3. **Approve Payroll**:
   - Click "✓ Approve" for each staff record
   - Status changes from "calculated" to "approved"

4. **Process Payment**:
   - Pay staff via your payment method
   - Return to dashboard
   - Click "💳 Mark Paid" for each record
   - Status changes to "paid"

5. **Export Reports**:
   - Go to `/admin/staff-earnings`
   - Select previous month
   - Click "Export CSV" for records

## Key Features Overview

### 💼 Flexible Compensation Profiles
- **High Base, Low Commission**: $25/hr + 5%
- **Balanced**: $18/hr + 15%
- **Commission Heavy**: $12/hr + 30%
- **Pure Commission**: $0/hr + 50%

### 🏆 Performance Tiers
- **Bronze** (0-20 appointments): 1.00x commission + $0
- **Silver** (21-40): 1.20x + $100
- **Gold** (41-60): 1.50x + $300
- **Platinum** (61+): 2.00x + $500

### 🎁 Bonus Types
- **Custom**: Any reason
- **Milestone**: 100th appointment, anniversary
- **Holiday**: Working busy days
- **Quality**: Consecutive 5-star reviews
- **Referral**: New customer/staff referrals
- **Retention**: Auto-calculated for repeat customers

### 👥 Team Bonuses
- Revenue targets
- Customer satisfaction goals
- Zero cancellations
- New customer acquisition

### ⭐ Skill Premiums
- Add hourly premium for certifications
- Example: Color specialist = +$3/hour
- Master stylist = +$5/hour

## Understanding Calculations

### How Net Pay is Calculated

```
Net Pay = Base Pay + Commission + Bonuses - Deductions

Where:
- Base Pay = Hourly Rate × Total Hours
- Commission = (Service Revenue × Commission %) × Tier Multiplier + Product Commission
- Bonuses = Individual + Team + Retention + Skill Premium + Tier Bonus
- Deductions = Uniform fees, kit fees, etc. (currently $0)
```

### How Hours are Estimated

Since there's no attendance system:
```
Total Hours = (Sum of Service Durations + 15min per appointment) / 60

Example:
- 10 appointments
- 5 haircuts (30 min each) = 150 min
- 3 color services (90 min each) = 270 min
- 2 treatments (60 min each) = 120 min
- Total service time = 540 min
- Buffer time (10 × 15min) = 150 min
- Total = 690 min ÷ 60 = 11.5 hours
```

## API Integration (For Developers)

### Calculate Payroll Programmatically

```typescript
const response = await fetch('/api/payroll/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    month: 12,
    year: 2025,
    staffId: 'optional-uuid' // Omit for all staff
  })
})

const result = await response.json()
console.log(result.data) // Payroll summary
```

### Get Payroll Summary

```typescript
const response = await fetch('/api/payroll/summary?month=12&year=2025')
const result = await response.json()
console.log(result.data.totalNetPay) // Total payroll cost
```

### Add Bonus Programmatically

```typescript
const response = await fetch('/api/payroll/bonuses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    staffId: 'uuid',
    bonusType: 'quality',
    amount: 150.00,
    description: '10 consecutive 5-star reviews',
    periodMonth: 12,
    periodYear: 2025
  })
})
```

## Troubleshooting

### "No payroll data for this period"
- Staff has no completed appointments
- Check appointment status = 'completed'
- Verify appointments have services in `appointment_services` table

### Hours showing 0
- No completed appointments in period
- Appointments missing service duration data
- Check `services.duration` is set

### Commission is $0
- Check staff has compensation profile with commission_rate > 0
- Verify services have prices in `appointment_services`
- Ensure appointments are status 'completed'

### Bonus not appearing
- Verify `period_month` and `period_year` match
- Recalculate payroll after adding bonus
- Check bonus amount is > 0

## Next Steps

✅ **You're all set!** The payroll system is ready to use.

**Recommended Actions:**
1. Run a test calculation for current month
2. Review staff compensation profiles
3. Add custom bonuses for December holidays
4. Set up team goals for next month
5. Train staff on viewing their earnings

## Need Help?

📖 **Full Documentation**: See [docs/PAYROLL_SYSTEM.md](docs/PAYROLL_SYSTEM.md)

🔧 **Technical Details**:
- Database Schema: `database/migrations/create_payroll_system.sql`
- Calculation Engine: `lib/payroll/engine.ts`
- Admin Dashboard: `app/admin/payroll/page.tsx`
- Staff Tracker: `app/admin/staff-earnings/page.tsx`

---

**Setup Version**: 1.0
**Date**: December 19, 2025
