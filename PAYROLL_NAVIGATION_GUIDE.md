# 🗺️ Payroll System - Navigation Guide

## How to Access Payroll Features

### 📍 Location in Admin Panel

The payroll system is accessible through the **Admin Sidebar** with two dedicated pages:

```
Admin Panel
└── Admin Sidebar (Left side)
    ├── 🏠 Dashboard
    ├── 📊 Business Intelligence
    ├── 🚀 Advanced Analytics
    ├── 📅 Appointments
    ├── 👥 Staff Management
    ├── 💰 Payroll Management ← NEW! (Main payroll page)
    ├── 📊 Staff Earnings ← NEW! (Staff tracker)
    ├── ✨ Services
    ├── 📂 Service Categories
    ├── 🛍️ Products
    ├── 📦 Product Categories
    ├── 🕐 Time Slots
    ├── 🖼️ Photo Gallery
    └── 🔍 Health Check
```

---

## 🎯 Page 1: Payroll Management

**URL**: `http://localhost:3000/admin/payroll`

**Menu Label**: 💰 Payroll Management (with **NEW** badge)

### What You Can Do Here:

1. **Calculate Monthly Payroll**
   - Select month/year from dropdowns
   - Click "🔄 Calculate Payroll" button
   - System calculates for all active staff

2. **View Summary Cards**
   - Total Staff count
   - Total Net Pay (total payroll cost)
   - Total Commissions
   - Total Bonuses

3. **Review Payroll Table**
   - Staff name/email
   - Performance tier (Bronze/Silver/Gold/Platinum)
   - Hours worked
   - Base pay
   - Commission earned
   - Bonuses received
   - Net pay (total)
   - Status (draft/calculated/approved/paid)

4. **Approve Payroll**
   - Click "✓ Approve" for each staff record
   - Changes status from "calculated" to "approved"

5. **Mark as Paid**
   - After actual payment made
   - Click "💳 Mark Paid"
   - Changes status to "paid"

6. **Add Custom Bonuses**
   - Click "+ Add Bonus" button
   - Modal opens with form:
     - Select staff member
     - Choose bonus type (custom/milestone/holiday/etc.)
     - Enter amount
     - Add description
   - Click "Add Bonus" to save

### Visual Layout:

```
┌─────────────────────────────────────────────────────────┐
│  💰 Payroll Management                  [+ Add Bonus]   │
│  Manage staff payroll, commissions, and bonuses         │
│                                         [🔄 Calculate]   │
├─────────────────────────────────────────────────────────┤
│  Period: [December ▼] [2025 ▼]                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │👥 Total │ │💵 Net   │ │💎 Comm  │ │🎁 Bonus │      │
│  │Staff: 5 │ │$12,500  │ │$4,200   │ │$1,500   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
├─────────────────────────────────────────────────────────┤
│  Staff Table:                                            │
│  ┌────────┬──────┬───────┬────────┬──────┬────────┐   │
│  │ Name   │ Tier │ Hours │ Base   │ Comm │ Net    │   │
│  ├────────┼──────┼───────┼────────┼──────┼────────┤   │
│  │ Sarah  │ Gold │ 45.5h │ $819   │ $650 │ $1,769 │   │
│  │ Mike   │Silver│ 32.0h │ $576   │ $420 │ $1,096 │   │
│  └────────┴──────┴───────┴────────┴──────┴────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Page 2: Staff Earnings

**URL**: `http://localhost:3000/admin/staff-earnings`

**Menu Label**: 📊 Staff Earnings

### What You Can Do Here:

1. **Filter by Staff**
   - Dropdown: "All Staff" or individual staff member
   - View specific person's earnings history

2. **Filter by Year**
   - Dropdown: Select year (2024, 2025, 2026)
   - See annual earnings breakdown

3. **View Summary Cards**
   - Total Earnings (for selected filters)
   - Total Appointments
   - Average Earnings per Period

4. **Review Earnings History Table**
   - Month-by-month breakdown
   - Appointments completed
   - Revenue generated
   - Base pay
   - Commission earned
   - Bonuses received
   - Net pay
   - Performance tier

5. **View Visual Chart**
   - Monthly earnings breakdown
   - Color-coded bars:
     - Blue = Base Pay
     - Green = Commission
     - Purple = Bonuses

6. **Export Data**
   - Click "📥 Export CSV" button
   - Downloads CSV file with all data
   - Filename: `staff-earnings-2025.csv`

### Visual Layout:

```
┌─────────────────────────────────────────────────────────┐
│  📊 Staff Earnings Tracker              [📥 Export CSV] │
│  Track individual staff performance and earnings         │
├─────────────────────────────────────────────────────────┤
│  Staff: [All Staff ▼]  Year: [2025 ▼]                   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │💰 Total      │ │📅 Total      │ │📊 Avg per    │   │
│  │Earnings      │ │Appointments  │ │Period        │   │
│  │$50,250       │ │120           │ │$4,187        │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Earnings History:                                       │
│  ┌──────────┬──────┬────────┬──────┬────────┬──────┐  │
│  │ Period   │ Apts │ Revenue│ Comm │ Bonus  │ Net  │  │
│  ├──────────┼──────┼────────┼──────┼────────┼──────┤  │
│  │ Dec 2025 │  45  │ $5,400 │ $810 │ $300   │$1,910│  │
│  │ Nov 2025 │  38  │ $4,560 │ $684 │ $200   │$1,460│  │
│  └──────────┴──────┴────────┴──────┴────────┴──────┘  │
├─────────────────────────────────────────────────────────┤
│  Monthly Breakdown Chart:                                │
│  December: [████████████████] $1,910                    │
│  November: [████████████    ] $1,460                    │
│  October:  [██████████      ] $1,200                    │
│                                                          │
│  Legend: ■ Base Pay  ■ Commission  ■ Bonuses           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Common User Workflows

### Workflow 1: Monthly Payroll Process (End of Month)

```
Step 1: Navigate
  Admin Panel → 💰 Payroll Management

Step 2: Select Period
  Period: [Previous Month ▼] [Current Year ▼]

Step 3: Calculate
  Click: "🔄 Calculate Payroll"
  ⏳ Wait 2-3 seconds
  ✅ Payroll calculated!

Step 4: Review
  Check each staff member's:
  - Hours worked
  - Commission amount
  - Bonuses
  - Net pay

Step 5: Add Bonuses (if needed)
  Click: "+ Add Bonus"
  Fill form → Submit
  Recalculate payroll

Step 6: Approve
  For each staff: Click "✓ Approve"

Step 7: Pay Staff
  Process actual payments (external)

Step 8: Mark Paid
  For each staff: Click "💳 Mark Paid"
  ✅ Done!
```

### Workflow 2: View Staff Performance

```
Step 1: Navigate
  Admin Panel → 📊 Staff Earnings

Step 2: Filter
  Staff: [Select staff member ▼]
  Year: [2025 ▼]

Step 3: Review
  View:
  - Summary cards (total earnings, appointments, average)
  - Earnings history table
  - Visual breakdown chart

Step 4: Export (optional)
  Click: "📥 Export CSV"
  Save file for records
  ✅ Done!
```

### Workflow 3: Add Holiday Bonus

```
Step 1: Navigate
  Admin Panel → 💰 Payroll Management

Step 2: Add Bonus
  Click: "+ Add Bonus"

Step 3: Fill Form
  Staff Member: [Select ▼]
  Bonus Type: "Holiday"
  Amount: $150
  Description: "Working Christmas week"

Step 4: Submit
  Click: "Add Bonus"
  ✅ Bonus created!

Step 5: Recalculate (if needed)
  Select period → "🔄 Calculate Payroll"
  ✅ Bonus appears in payroll!
```

---

## 🎨 Visual Indicators

### Badges
- **NEW** badge (green) = New payroll features
- **BI** badge (purple) = Business Intelligence
- **DIAG** badge (blue) = Diagnostics

### Status Colors
- **Gray** = Draft (not calculated yet)
- **Blue** = Calculated (awaiting approval)
- **Green** = Approved (ready to pay)
- **Purple** = Paid (payment completed)

### Tier Badges
- **Bronze** = Purple badge
- **Silver** = Blue badge
- **Gold** = Yellow badge
- **Platinum** = Pink badge

---

## 📱 Mobile Access

The payroll system is **fully responsive**:

### Mobile Menu
- Tap hamburger menu (☰) in top-left
- Sidebar slides in from left
- Scroll to find payroll items:
  - 💰 Payroll Management
  - 📊 Staff Earnings
- Tap to navigate
- Sidebar auto-closes

### Mobile Layout
- Tables become scrollable horizontally
- Cards stack vertically
- Buttons remain accessible
- Forms adapt to screen size

---

## 🔐 Access Requirements

### Required Permissions
To access payroll pages, you must:

1. ✅ Be logged in to the system
2. ✅ Have admin role (`profiles.is_admin = true`)

### If You Don't Have Access
You'll see:
- Redirect to login page (if not logged in)
- Redirect to home page (if not admin)

### Granting Admin Access
To make a user an admin:

```sql
-- In Supabase SQL Editor
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@pandorabeauty.com';
```

---

## ⌨️ Keyboard Shortcuts (Future Enhancement)

Potential shortcuts to add:

- `P` = Open Payroll Management
- `E` = Open Staff Earnings
- `C` = Calculate Payroll
- `B` = Add Bonus
- `X` = Export CSV

---

## 🆘 Troubleshooting Navigation

### "I can't find the payroll menu"

**Check**:
1. Are you on `/admin` routes?
2. Is the sidebar visible? (Desktop: left side, Mobile: tap ☰)
3. Do you have admin privileges?

**Solution**: Make sure you're logged in as admin.

### "Menu items not clickable"

**Check**:
1. JavaScript enabled?
2. Page fully loaded?
3. Browser console errors?

**Solution**: Refresh page, check console for errors.

### "Page not found (404)"

**Check**:
1. URL correct? Should be `/admin/payroll` or `/admin/staff-earnings`
2. Pages created in `app/admin/` directory?

**Solution**: Verify files exist and server restarted.

---

## 🎓 Training Tips

### For New Admins
1. Start with **Staff Earnings** page (simpler, read-only)
2. Practice filtering and exporting
3. Then move to **Payroll Management**
4. Do a test calculation first
5. Try adding a small bonus
6. Review the workflow guide above

### Best Practices
- Calculate payroll on 1st of each month
- Review before approving
- Add bonuses before final calculation
- Export CSV for records
- Keep staff informed of tier changes

---

## 📚 Related Documentation

- **Quick Start**: [PAYROLL_QUICK_START.md](PAYROLL_QUICK_START.md)
- **Setup Guide**: [PAYROLL_SETUP_GUIDE.md](PAYROLL_SETUP_GUIDE.md)
- **Technical Docs**: [docs/PAYROLL_SYSTEM.md](docs/PAYROLL_SYSTEM.md)
- **Implementation Summary**: [PAYROLL_IMPLEMENTATION_SUMMARY.md](PAYROLL_IMPLEMENTATION_SUMMARY.md)

---

**Navigation Version**: 1.0
**Last Updated**: December 19, 2025
**Access Level**: Admin Only
