# 💰 Payroll System - Quick Start

## 🎯 What's New

Your Pandora Beauty Salon now has a **complete Hybrid Payroll System** with:
- ✅ Flexible compensation profiles (4 options)
- ✅ Performance-based tiers (Bronze → Platinum)
- ✅ Custom bonuses & team bonuses
- ✅ Commission tracking with multipliers
- ✅ Staff earnings analytics
- ✅ No attendance tracking needed!

## 📍 Access Payroll

The payroll system is now available in your **Admin Sidebar**:

1. **💰 Payroll Management** (NEW badge) - Main payroll dashboard
2. **📊 Staff Earnings** - Individual staff earnings tracker

## ⚡ Quick Setup (5 Minutes)

### Step 1: Run Database Migration
1. Open Supabase Dashboard → **SQL Editor**
2. Copy contents from: `database/migrations/create_payroll_system.sql`
3. Paste and click **Run**
4. ✅ Done! (8 tables created with default data)

### Step 2: Test It Out
1. Go to **Admin Panel** → **💰 Payroll Management**
2. Select current month/year
3. Click **"🔄 Calculate Payroll"**
4. View calculated payroll for all staff!

### Step 3: Explore Features
- Click **"+ Add Bonus"** to create custom bonuses
- Check **📊 Staff Earnings** to see individual performance
- Click **"📥 Export CSV"** to download reports

## 🚀 How It Works

```
Monthly Workflow:
1. Staff complete appointments → System tracks everything
2. End of month → Click "Calculate Payroll"
3. Review → Approve → Mark as Paid
4. Staff get paid! 💸
```

## 💎 Key Features at a Glance

### Compensation Profiles (Staff can choose):
- **High Base, Low Commission**: $25/hr + 5%
- **Balanced**: $18/hr + 15% (Default)
- **Commission Heavy**: $12/hr + 30%
- **Pure Commission**: $0/hr + 50%

### Performance Tiers (Auto-calculated monthly):
| Tier | Appointments | Commission Boost | Bonus |
|------|--------------|------------------|-------|
| 🥉 Bronze | 0-20 | 1.00x (normal) | $0 |
| 🥈 Silver | 21-40 | 1.20x (+20%) | $100 |
| 🥇 Gold | 41-60 | 1.50x (+50%) | $300 |
| 💎 Platinum | 61+ | 2.00x (double!) | $500 |

### Bonus Types:
- **Custom**: Any reason you want
- **Team**: Salon-wide goals
- **Retention**: Repeat customers (auto)
- **Skill**: Certifications (+$3-5/hr)
- **Milestone**: Anniversaries, achievements
- **Holiday**: Working busy days

## 📖 Full Documentation

For complete details, see:
- **Setup Guide**: [PAYROLL_SETUP_GUIDE.md](PAYROLL_SETUP_GUIDE.md)
- **Technical Docs**: [docs/PAYROLL_SYSTEM.md](docs/PAYROLL_SYSTEM.md)

## 🎬 Example: Adding a Holiday Bonus

```
1. Go to: Admin → Payroll Management
2. Click: "+ Add Bonus"
3. Select: Staff member
4. Type: "Holiday"
5. Amount: $150
6. Description: "Working Christmas week"
7. Submit
8. Recalculate payroll → Bonus applied! ✨
```

## 📊 What Gets Calculated

For each staff member, the system calculates:

```
Net Pay = Base Pay + Commissions + Bonuses

Where:
✓ Base Pay = Hourly Rate × Hours Worked
✓ Commissions = Service Revenue × Commission % × Tier Multiplier
✓ Bonuses = Custom + Team + Retention + Skill + Tier
```

**Hours** are auto-estimated from appointment durations (no clock-in needed!)

## 🔧 Customization Options

### Assign Different Pay Structures
```sql
-- Example: Switch staff to "Commission Heavy" profile
UPDATE staff
SET compensation_profile_id = (
  SELECT id FROM compensation_profiles
  WHERE name = 'Commission Heavy'
)
WHERE full_name = 'Sarah Johnson';
```

### Add Skill Premium
```sql
-- Example: Color specialist gets +$3/hour
UPDATE staff
SET skill_premium_hourly = 3.00
WHERE full_name = 'Sarah Johnson';
```

### Create Team Bonus
```sql
-- Example: $50k revenue goal = $1,000 bonus split
INSERT INTO team_bonuses (
  name, bonus_type, target_value,
  bonus_amount, distribution_method,
  period_start, period_end
) VALUES (
  'January Revenue Goal',
  'revenue_target',
  50000.00,
  1000.00,
  'equal',
  '2025-01-01',
  '2025-01-31'
);
```

## ✅ Next Steps

1. ✅ **Run migration** (5 minutes)
2. ✅ **Test calculate payroll** (2 minutes)
3. ✅ **Add a bonus** (1 minute)
4. ✅ **View staff earnings** (1 minute)
5. 🎉 **You're done!**

## 🆘 Need Help?

**Common Issues:**

❓ **"No payroll data found"**
→ Staff need completed appointments first

❓ **"Hours showing 0"**
→ Appointments need services with durations

❓ **"Commission is $0"**
→ Check staff has commission_rate > 0 in their profile

---

**Questions?** Check the [Full Documentation](docs/PAYROLL_SYSTEM.md)

**Happy Paying!** 💰✨
