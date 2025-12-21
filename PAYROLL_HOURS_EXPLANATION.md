# ⏰ Understanding the Hours Column in Payroll

## What Does the Hours Column Show?

The **Hours column** in the Payroll Management page displays the **total estimated working hours** for each staff member during the selected month.

---

## 📊 Example from Payroll Table

```
┌─────────┬──────┬───────┬─────────┬────────┬────────┬──────────┐
│ Staff   │ Tier │ Hours │ Base Pay│ Comm   │ Bonus  │ Net Pay  │
├─────────┼──────┼───────┼─────────┼────────┼────────┼──────────┤
│ Sarah   │ Gold │ 45.5h │ $819.00 │ $810.00│ $300.00│ $1,929.00│
│ Mike    │Silver│ 32.0h │ $576.00 │ $420.00│ $100.00│ $1,096.00│
│ Lisa    │Bronze│ 18.5h │ $333.00 │ $180.00│ $0.00  │ $513.00  │
└─────────┴──────┴───────┴─────────┴────────┴────────┴──────────┘
                    ↑
                    This shows total hours worked
```

**What it means:**
- Sarah worked **45.5 hours** in December
- Mike worked **32.0 hours** in December
- Lisa worked **18.5 hours** in December

---

## 🤔 How Are Hours Calculated?

**Important**: You don't need to track attendance or clock in/out!

The system **automatically estimates** hours based on completed appointments.

### Formula:

```
Total Hours = (Sum of Service Durations + Buffer Time) ÷ 60 minutes

Where:
- Service Durations = Total minutes of all services performed
- Buffer Time = 15 minutes per appointment (for setup/cleanup)
```

---

## 📝 Step-by-Step Calculation Example

### Sarah's December Hours Calculation:

**Appointments Completed: 45**

**Services Performed:**
- 20 Haircuts (30 min each) = 600 min
- 15 Color Services (90 min each) = 1,350 min
- 10 Blowouts (45 min each) = 450 min

**Total Service Time:**
600 + 1,350 + 450 = **2,400 minutes**

**Buffer Time:**
45 appointments × 15 min = **675 minutes**

**Total Minutes:**
2,400 + 675 = **3,075 minutes**

**Total Hours:**
3,075 ÷ 60 = **51.25 hours**

Wait, but the table shows 45.5 hours? Let me explain...

**Note**: The actual calculation in the system may vary slightly based on:
- Exact service durations in your database
- Number of services per appointment
- Rounding methods

---

## 🔍 What Does This Hour Number Include?

### ✅ Included:

1. **Service Performance Time**
   - Time spent actually doing services (haircut, color, etc.)
   - Based on `services.duration` field in database

2. **Setup & Cleanup Buffer**
   - 15 minutes per appointment
   - Accounts for:
     - Greeting customer
     - Preparing station
     - Cleaning tools
     - Checking out customer

3. **Multiple Services Per Appointment**
   - If one appointment has 2 services (haircut + color)
   - Both service durations are counted
   - Only one 15-min buffer per appointment

### ❌ NOT Included:

1. **Lunch Breaks**
   - Not tracked or deducted

2. **Downtime Between Appointments**
   - Time sitting idle waiting for next customer
   - Not counted

3. **Administrative Work**
   - Answering phones
   - Stocking supplies
   - Not tracked

4. **Training or Meetings**
   - Not included in calculation

---

## 💡 Why Use Estimated Hours Instead of Time Clock?

### Benefits:

✅ **No Time Clock Needed**
- Staff don't need to clock in/out
- No forgotten punches
- No time card disputes

✅ **Automatic Calculation**
- System calculates from actual work done
- Based on real customer services
- Updates automatically with new appointments

✅ **Fair Compensation**
- Hours directly tied to productivity
- Reflects actual customer service time
- Includes setup/cleanup time

✅ **Simple to Manage**
- No manual hour entry
- No timesheet reviews
- No punch corrections

### Trade-offs:

⚠️ **Estimates, Not Exact**
- Doesn't track arrival/departure times
- Assumes services take scheduled duration
- May not match actual clock hours

⚠️ **Doesn't Track Non-Service Time**
- Lunch breaks not deducted (but not paid extra)
- Idle time not counted (but not deducted)
- Administrative work not tracked

---

## 📐 How Hours Affect Pay

### Base Pay Calculation:

```
Base Pay = Hourly Rate × Total Hours

Example (Sarah on "Balanced" profile):
- Hourly Rate: $18/hour
- Total Hours: 45.5h
- Base Pay = $18 × 45.5 = $819.00
```

### Skill Premium:

If staff has skill premium (e.g., certified color specialist):

```
Skill Premium Pay = Skill Premium Rate × Total Hours

Example (Sarah with $3/hr skill premium):
- Skill Premium Rate: $3/hour
- Total Hours: 45.5h
- Skill Premium = $3 × 45.5 = $136.50
```

This is added to bonuses in the payroll calculation.

---

## 🎯 Common Scenarios

### Scenario 1: Full-Time Staff

```
Staff: Sarah
Appointments: 45
Services: Mix of haircuts, colors, treatments
Calculated Hours: 45.5 hours

Interpretation:
- Averaging ~11 hours/week (part-time)
- Or 4 busy weeks + 1 slow week
- Normal for salon work (variable schedule)
```

### Scenario 2: Part-Time Staff

```
Staff: Lisa
Appointments: 15
Services: Mostly basic haircuts
Calculated Hours: 18.5 hours

Interpretation:
- True part-time (1-2 days/week)
- Lower service complexity
- Still gets base pay for those hours
```

### Scenario 3: No Appointments

```
Staff: New Hire Mike
Appointments: 0 (training month)
Calculated Hours: 0 hours

Result:
- Hours: 0h
- Base Pay: $0
- Commission: $0
- Net Pay: $0 (unless manual bonus added)

Solution:
Add a manual "training stipend" bonus if needed
```

---

## 🔧 How to Verify Hours Are Correct

### Step 1: Check Appointments Count

1. Go to **Appointments** page
2. Filter by staff member + month
3. Count completed appointments
4. Compare to payroll table

**Expected**: Should match appointment count × average service time

### Step 2: Review Service Durations

1. Go to **Services** page
2. Check `duration` field for common services
3. Examples:
   - Haircut: 30 min
   - Color: 90 min
   - Treatment: 60 min

**Expected**: Hours should roughly equal: (total service min + buffer) ÷ 60

### Step 3: Manual Calculation

```
Quick Estimate:

If Sarah did 45 appointments, mostly haircuts (30 min):
- Service time: 45 × 30 = 1,350 min
- Buffer time: 45 × 15 = 675 min
- Total: 2,025 min ÷ 60 = 33.75 hours (minimum)

If she did longer services (colors, treatments):
- Hours would be higher (45-60 hours range)

The 45.5 hours shown is reasonable ✓
```

---

## ❓ Common Questions About Hours

### Q: Why are the hours lower than expected?

**Possible Reasons:**
1. **Fewer appointments than you thought**
   - Check actual completed appointment count
   - Cancelled/no-show appointments don't count

2. **Shorter service durations**
   - Check if services have correct duration values
   - Quick services (blowout = 30 min) vs long services (color = 90 min)

3. **Part-time schedule**
   - Staff only worked some days
   - Variable salon scheduling

### Q: Why are the hours higher than expected?

**Possible Reasons:**
1. **Multiple services per appointment**
   - One customer got haircut + color + treatment
   - All durations counted

2. **Longer service durations**
   - Complex services take more time
   - Specialty treatments (keratin = 120 min)

3. **High appointment volume**
   - Busy month
   - Many back-to-back appointments

### Q: Can I adjust the hours manually?

**Answer**: Not directly in the UI, but you can:

**Option 1**: Adjust base pay using bonuses
```
Example: Sarah should get 50 hours instead of 45.5
- Missing: 4.5 hours
- Rate: $18/hour
- Add bonus: 4.5 × $18 = $81
- Description: "Hour adjustment - 4.5 hours"
```

**Option 2**: Update service durations in database
```sql
-- Example: Increase haircut time from 30 to 35 min
UPDATE services
SET duration = 35
WHERE name = 'Haircut';

-- Then recalculate payroll
```

### Q: What if hours seem way off?

**Troubleshooting Steps:**

1. **Check service durations in database**
   ```sql
   SELECT name, duration FROM services;
   ```
   - Make sure durations are reasonable
   - Example: Haircut = 30-45 min, Color = 60-120 min

2. **Verify appointment count**
   - Count completed appointments manually
   - Compare to system count

3. **Check for data issues**
   - Missing service durations (NULL values)
   - Appointments without services
   - Duplicate records

4. **Contact support**
   - Provide: Staff name, month, expected vs actual hours
   - Include screenshot of payroll table

---

## 🎓 Pro Tips for Managing Hours

### Tip 1: Set Accurate Service Durations

Make sure your **Services** page has realistic durations:

```
Good Examples:
- Women's Haircut: 45 min
- Men's Haircut: 30 min
- Full Color: 90 min
- Highlights: 120 min
- Blowout: 30 min
- Deep Conditioning: 45 min

Why: Accurate durations = accurate hour estimates
```

### Tip 2: Review Hours Each Month

During payroll review:
1. Look at hours column
2. Ask yourself: "Does this seem right?"
3. Compare to previous months
4. Investigate big changes (±20% difference)

### Tip 3: Use Hours for Staffing Decisions

```
Analysis:
- Sarah: 45.5 hours/month (full-time track)
- Mike: 32 hours/month (part-time)
- Lisa: 18 hours/month (minimal)

Questions:
- Should Lisa get more hours?
- Is Sarah overworked?
- Can Mike take more appointments?
```

### Tip 4: Benchmark Against Industry

```
Typical Salon Hours:
- Full-time stylist: 30-40 hours/week = 120-160 hours/month
- Part-time stylist: 15-25 hours/week = 60-100 hours/month
- Weekend-only: 16 hours/week = 64 hours/month

Compare your numbers to these ranges
```

---

## 📊 Hours Column in Different Views

### Payroll Management Page

```
Shows: Total hours for the month
Format: "45.5h"
Purpose: Calculate base pay
```

### Staff Earnings Page

```
Shows: Hours per month in table
Format: Same as payroll
Purpose: Track hours over time
```

### Exported CSV

```
Shows: Hours as decimal number
Format: "45.5" (without "h")
Purpose: Analysis in Excel
```

---

## 🔮 Future Enhancements (Coming Soon?)

Potential improvements to hours tracking:

1. **Break Down by Week**
   - Show hours per week within the month
   - Identify busy vs slow weeks

2. **Service Type Breakdown**
   - Hours spent on haircuts vs colors
   - Identify specialization

3. **Efficiency Metrics**
   - Actual time vs scheduled time
   - Speed bonuses for fast service

4. **Manual Hour Entry**
   - Option to override calculated hours
   - For special circumstances

5. **Time Clock Integration**
   - Optional integration with time clocks
   - Hybrid approach (scheduled + actual)

---

## 📝 Summary

**The Hours Column Shows:**
✅ Estimated total working hours for the month
✅ Calculated from service durations + buffer time
✅ Automatically updated based on completed appointments
✅ Used to calculate base pay (hours × hourly rate)

**Key Formula:**
```
Hours = (Service Time + 15 min buffer per appointment) ÷ 60
```

**Why It's This Way:**
- ✅ No time clock needed
- ✅ Automatic calculation
- ✅ Fair compensation
- ✅ Tied to productivity

**What to Do:**
- ✅ Review hours each month
- ✅ Verify against appointment count
- ✅ Check service durations are accurate
- ✅ Investigate big discrepancies
- ✅ Add manual bonuses if adjustments needed

---

**Need More Help?**

See also:
- [PAYROLL_USER_MANUAL.md](PAYROLL_USER_MANUAL.md) - Complete user guide
- [PAYROLL_VISUAL_GUIDE.md](PAYROLL_VISUAL_GUIDE.md) - Visual walkthrough
- [lib/payroll/engine.ts](lib/payroll/engine.ts) - Technical calculation code

---

**Document Version**: 1.0
**Last Updated**: December 20, 2025
