# Payroll System Documentation

## Overview

The Hybrid Payroll System combines flexible compensation profiles, performance-based tiers, team bonuses, and custom bonuses to create a comprehensive staff compensation solution for Pandora Beauty Salon.

## Features

### 1. **Flexible Compensation Profiles**

Staff can choose from multiple pay structure options:

- **High Base, Low Commission**: $25/hour + 5% commission
- **Balanced**: $18/hour + 15% commission
- **Commission Heavy**: $12/hour + 30% commission
- **Pure Commission**: $0/hour + 50% commission

**Location in Database**: `compensation_profiles` table

**Staff Assignment**: Each staff member is linked to a compensation profile via `staff.compensation_profile_id`

**Profile Switching**: Staff can change profiles quarterly (tracked via `staff.can_change_profile_at`)

### 2. **Performance Tiers**

Dynamic commission multipliers based on monthly completed appointments:

| Tier | Min Appointments | Max Appointments | Commission Multiplier | Monthly Bonus |
|------|-----------------|------------------|---------------------|---------------|
| Bronze | 0 | 20 | 1.00x | $0 |
| Silver | 21 | 40 | 1.20x | $100 |
| Gold | 41 | 60 | 1.50x | $300 |
| Platinum | 61+ | Unlimited | 2.00x | $500 |

**Location in Database**: `performance_tiers` table

**Auto-Calculation**: Tiers are automatically determined during monthly payroll calculation based on completed appointments.

### 3. **Service Type Multipliers**

Different services can have different commission rates:

- Basic services (haircut): 1.00x (standard rate)
- Premium services (balayage, keratin): 1.50x
- Luxury packages: 2.00x

**Location in Database**: `service_commission_multipliers` table

**Setup**: Admin can assign multipliers to individual services in the database.

### 4. **Team Bonuses**

Salon-wide goals that benefit all staff:

**Types**:
- **Revenue Target**: Monthly salon revenue goal
- **Satisfaction Rating**: Average customer rating threshold
- **Zero Cancellations**: No cancellations for a period
- **New Customers**: Number of new customer acquisitions

**Distribution Methods**:
- **Equal**: Split equally among all active staff
- **Proportional**: Based on hours worked or revenue generated
- **Performance-based**: Weighted by individual performance metrics

**Location in Database**: `team_bonuses` table

**Example**: "Monthly revenue target $50,000 = $1,000 bonus split equally among staff"

### 5. **Custom Bonuses**

Admin-created bonuses for special occasions or achievements:

**Types**:
- **Milestone**: 100th appointment, 1-year anniversary
- **Holiday**: Working on busy days (Valentine's, Prom season)
- **Quality**: 10 consecutive 5-star reviews
- **Speed**: Completing appointments faster than average
- **Referral**: Bringing in new customers or staff
- **Custom**: Any other bonus reason

**Location in Database**: `staff_bonuses` table

**Admin Control**: Full CRUD operations via `/admin/payroll` dashboard

### 6. **Retention Bonuses**

Automatically calculated based on repeat customer behavior:

- **Repeat Customer Bonus**: $50 per customer who returns to same stylist within 30 days
- **High Retention Bonus**: +$200 if staff has 3+ repeat customers in a month

**Calculation**: Automated in `PayrollEngine.calculateRetentionBonus()`

### 7. **Skill Premiums**

Hourly rate increases for certifications and specialized skills:

- Certified color specialist: +$3/hour
- Master stylist: +$5/hour
- Trainer role: +$100/month stipend

**Location in Database**: `staff.skill_premium_hourly` field

**Application**: Automatically added to total hours calculation

### 8. **Product Sales Commission**

Commission on product add-ons during appointments:

- **Default Rate**: 10% commission on all product sales
- **Tracking**: Separate commission transactions in `product_commission_transactions`

## Database Schema

### Core Tables

#### `compensation_profiles`
Defines flexible pay structure templates.

**Columns**:
- `id`, `name`, `description`
- `hourly_rate`, `commission_rate`
- `is_active`, `created_at`, `updated_at`

#### `performance_tiers`
Commission tier levels based on performance.

**Columns**:
- `id`, `name`
- `min_appointments`, `max_appointments`
- `commission_multiplier`, `monthly_bonus`
- `display_order`, `is_active`, `created_at`

#### `service_commission_multipliers`
Commission multipliers for specific services.

**Columns**:
- `id`, `service_id`, `multiplier`, `description`
- `created_at`, `updated_at`

#### `team_bonuses`
Salon-wide team bonus goals.

**Columns**:
- `id`, `name`, `description`
- `bonus_type`, `target_value`, `bonus_amount`
- `distribution_method`
- `period_start`, `period_end`
- `is_achieved`, `achieved_at`, `is_active`
- `created_at`, `updated_at`

#### `staff_bonuses`
Individual custom bonuses.

**Columns**:
- `id`, `staff_id`
- `bonus_type`, `amount`, `description`
- `awarded_date`
- `period_month`, `period_year`
- `created_by`, `notes`, `created_at`

#### `monthly_payroll`
Monthly payroll calculations and records.

**Columns**:
- `id`, `staff_id`
- `period_month`, `period_year`
- `total_hours`, `hourly_rate`, `base_pay`
- `total_appointments`, `completed_appointments`
- `total_service_revenue`, `total_product_sales`
- `commission_rate`, `base_commission`
- `performance_tier_id`, `tier_multiplier`, `tier_bonus`
- `adjusted_commission`
- `individual_bonuses`, `team_bonuses`, `skill_premium`, `retention_bonus`
- `total_bonuses`
- `gross_pay`, `deductions`, `net_pay`
- `status` (draft, calculated, approved, paid)
- `calculated_at`, `approved_at`, `approved_by`, `paid_at`
- `created_at`, `updated_at`

#### `commission_transactions`
Detailed commission tracking per appointment.

**Columns**:
- `id`, `staff_id`, `appointment_id`, `service_id`
- `service_price`
- `base_commission_rate`, `service_multiplier`, `tier_multiplier`
- `commission_amount`
- `period_month`, `period_year`
- `created_at`

#### `product_commission_transactions`
Product sales commission tracking.

**Columns**:
- `id`, `staff_id`, `appointment_id`, `product_id`
- `product_price`, `quantity`
- `commission_rate`, `commission_amount`
- `period_month`, `period_year`
- `created_at`

## API Endpoints

### Calculate Payroll
**POST** `/api/payroll/calculate`

Calculate payroll for a period (all staff or specific staff member).

**Request Body**:
```json
{
  "month": 12,
  "year": 2025,
  "staffId": "optional-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalStaff": 5,
    "totalGrossPay": 12500.00,
    "totalNetPay": 12500.00,
    "totalCommissions": 4200.00,
    "totalBonuses": 1500.00,
    "totalHours": 320,
    "payrolls": [...]
  }
}
```

### Get Payroll Summary
**GET** `/api/payroll/summary?month=12&year=2025`

Retrieve calculated payroll for a period.

### Approve Payroll
**POST** `/api/payroll/approve`

Approve a payroll record.

**Request Body**:
```json
{
  "payrollId": "uuid"
}
```

### Mark as Paid
**POST** `/api/payroll/mark-paid`

Mark a payroll record as paid.

**Request Body**:
```json
{
  "payrollId": "uuid"
}
```

### Bonuses
**GET** `/api/payroll/bonuses?staffId=uuid&month=12&year=2025`

Get bonuses for staff member or all staff.

**POST** `/api/payroll/bonuses`

Create a custom bonus.

**Request Body**:
```json
{
  "staffId": "uuid",
  "bonusType": "custom",
  "amount": 200.00,
  "description": "Excellent customer service",
  "periodMonth": 12,
  "periodYear": 2025,
  "notes": "Optional notes"
}
```

**DELETE** `/api/payroll/bonuses?id=uuid`

Delete a bonus.

## Payroll Calculation Engine

**Location**: [lib/payroll/engine.ts](c:\node\pandora-booking\lib\payroll\engine.ts)

### `PayrollEngine` Class

Main calculation engine with methods:

#### `calculateStaffPayroll(staffId, period)`
Calculates complete payroll for a single staff member.

**Process**:
1. Get staff details and compensation profile
2. Fetch completed appointments for period
3. Calculate total service revenue
4. Calculate product sales commission
5. Determine performance tier based on appointment count
6. Calculate base commission
7. Apply tier multiplier to commission
8. Calculate product commission (10%)
9. Sum individual bonuses
10. Calculate retention bonus (repeat customers)
11. Calculate team bonus share
12. Calculate skill premium
13. Calculate base pay (hourly × hours)
14. Sum all bonuses
15. Calculate gross pay, deductions, net pay

#### `calculateAllStaffPayroll(period)`
Calculates payroll for all active staff members.

#### `savePayrollRecord(data, period)`
Saves calculated payroll to `monthly_payroll` table.

#### `approvePayroll(payrollId, approvedBy)`
Changes status to 'approved'.

#### `markAsPaid(payrollId)`
Changes status to 'paid'.

#### `getPayrollSummary(period)`
Returns summary with totals for all staff.

### Helper Methods

- `getPerformanceTier(appointmentCount)`: Determines tier based on appointments
- `calculateRetentionBonus(staffId, period)`: Calculates repeat customer bonuses
- `calculateTeamBonusShare(staffId, period)`: Distributes team bonuses
- `calculateTotalHours(staffId, period)`: Estimates hours from appointment durations

**Note**: Since there's no attendance system, hours are estimated from service durations + 15min buffer per appointment.

## Admin Dashboard

**Location**: [/admin/payroll](c:\node\pandora-booking\app\admin\payroll\page.tsx)

### Features

1. **Period Selector**: Choose month/year to view
2. **Calculate Payroll Button**: Recalculate all staff payroll for selected period
3. **Add Bonus Button**: Create custom bonuses for staff
4. **Summary Cards**:
   - Total Staff
   - Total Net Pay
   - Total Commissions
   - Total Bonuses

5. **Payroll Table**: Shows all staff payroll records with:
   - Staff name/email
   - Performance tier
   - Hours worked
   - Base pay
   - Commission
   - Bonuses
   - Net pay
   - Status
   - Actions (Approve, Mark Paid)

6. **Add Bonus Modal**: Create custom bonuses on the fly

## Staff Earnings Tracker

**Location**: [/admin/staff-earnings](c:\node\pandora-booking\app\admin\staff-earnings\page.tsx)

### Features

1. **Filter by Staff**: View individual or all staff
2. **Filter by Year**: View annual earnings
3. **Export to CSV**: Download earnings data
4. **Summary Cards**:
   - Total Earnings
   - Total Appointments
   - Average Earnings per Period

5. **Earnings History Table**: Detailed breakdown per period
6. **Visual Chart**: Monthly earnings breakdown (base, commission, bonuses)

## Usage Workflow

### Monthly Payroll Process

1. **End of Month**:
   - Admin goes to `/admin/payroll`
   - Selects the completed month/year
   - Clicks "Calculate Payroll"

2. **System Calculates**:
   - Fetches all completed appointments
   - Determines performance tiers
   - Calculates commissions with multipliers
   - Adds bonuses (custom, team, retention, skill)
   - Generates payroll records with status 'calculated'

3. **Review & Approve**:
   - Admin reviews each staff payroll record
   - Clicks "Approve" for each record
   - Status changes to 'approved'

4. **Payment**:
   - After actual payment is made
   - Admin clicks "Mark Paid"
   - Status changes to 'paid'

### Adding Custom Bonuses

1. Click "+ Add Bonus" button
2. Select staff member
3. Choose bonus type (custom, milestone, holiday, etc.)
4. Enter amount and description
5. Click "Add Bonus"
6. Bonus will be included in next payroll calculation

### Viewing Staff Earnings

1. Go to `/admin/staff-earnings`
2. Select staff member (or "All Staff")
3. Select year
4. View earnings history table and chart
5. Click "Export CSV" to download data

## Row Level Security (RLS)

All payroll tables have RLS enabled:

- **Admins**: Full access to all records (SELECT, INSERT, UPDATE, DELETE)
- **Staff**: Can view their own payroll data (SELECT only)
- **Public**: Can view active compensation profiles and tiers (read-only)

## Migration Instructions

### 1. Run Database Migration

Execute the SQL migration file in your Supabase SQL Editor:

```bash
database/migrations/create_payroll_system.sql
```

This will create all necessary tables, indexes, RLS policies, and default data.

### 2. Update Navigation

Add links to admin navigation:

```tsx
// In your admin layout or navigation component
<Link href="/admin/payroll">💰 Payroll</Link>
<Link href="/admin/staff-earnings">📊 Staff Earnings</Link>
```

### 3. Assign Compensation Profiles to Staff

All existing staff will default to "Balanced" profile. To update:

1. Go to Supabase dashboard
2. Navigate to `staff` table
3. Set `compensation_profile_id` for each staff member
4. Set `skill_premium_hourly` for certified staff (e.g., 3.00 for color specialists)

### 4. Configure Service Multipliers (Optional)

To set premium commission rates for specific services:

```sql
-- Example: Set 1.5x multiplier for balayage service
INSERT INTO service_commission_multipliers (service_id, multiplier, description)
VALUES (
  'your-balayage-service-uuid',
  1.50,
  'Premium service'
);
```

### 5. Create Team Bonuses (Optional)

Example team bonus:

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
  'December Revenue Goal',
  'Reach $50,000 in revenue',
  'revenue_target',
  50000.00,
  1000.00,
  'equal',
  '2025-12-01',
  '2025-12-31'
);
```

## Testing

### Test Payroll Calculation

1. Ensure you have staff with completed appointments
2. Go to `/admin/payroll`
3. Select current or previous month
4. Click "Calculate Payroll"
5. Verify calculations in the table

### Test Custom Bonus

1. Click "+ Add Bonus"
2. Select a staff member
3. Enter $100 bonus with description
4. Submit
5. Recalculate payroll
6. Verify bonus appears in total

### Test Staff Earnings Tracker

1. Go to `/admin/staff-earnings`
2. Select a staff member
3. View their earnings history
4. Export CSV and verify data

## Future Enhancements

Potential additions:

1. **Automated Team Bonus Tracking**: Automatically mark team bonuses as achieved when goals are met
2. **Real-time Earnings Dashboard**: Let staff view their current month earnings in real-time
3. **Predictive Analytics**: Show staff "You're on track to earn $X this month"
4. **Tax Deductions**: Add support for tax withholding
5. **Direct Deposit Integration**: Connect to payment processors
6. **Mobile App**: Staff mobile app to view earnings on the go
7. **Gamification**: Leaderboards, badges, achievement notifications
8. **Advanced Reporting**: Year-end tax reports, quarterly summaries

## Troubleshooting

### Payroll calculation returns $0

**Check**:
- Staff has completed appointments with `status = 'completed'`
- Appointments are in the selected month/year
- Appointments have services in `appointment_services` table
- Staff has a compensation profile assigned

### Hours calculation seems wrong

**Note**: Hours are estimated from service durations since there's no attendance system.

**Calculation**: Sum of all service durations + 15min buffer per appointment, converted to hours.

**To adjust**: Modify the buffer time in `PayrollEngine.calculateTotalHours()` method.

### Commission not applying tier multiplier

**Check**:
- Performance tiers are active (`is_active = true`)
- Appointment count falls within tier range
- Verify tier assignment in `monthly_payroll.performance_tier_id`

### Bonuses not showing in payroll

**Check**:
- Bonus `period_month` and `period_year` match payroll period
- Recalculate payroll after adding bonuses
- Verify bonus amount > 0

## Support

For issues or questions:
- Check [CLAUDE.md](c:\node\pandora-booking\CLAUDE.md) for project context
- Review migration file: [create_payroll_system.sql](c:\node\pandora-booking\database\migrations\create_payroll_system.sql)
- Examine calculation engine: [lib/payroll/engine.ts](c:\node\pandora-booking\lib\payroll\engine.ts)

---

**Document Version**: 1.0
**Last Updated**: December 19, 2025
**Author**: Claude Code
