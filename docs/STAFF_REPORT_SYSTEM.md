# Staff Report System Documentation

## Overview

The Staff Report System is a comprehensive reporting solution that generates detailed performance and payroll reports for all staff members. It combines analytics, payroll data, and performance metrics into a single, professional PDF-ready document.

## Features

### 📊 Complete Data Integration
- Pulls data from appointments, services, products, payroll, and analytics
- Combines AnalyticsEngine and PayrollEngine data
- Calculates performance metrics, rankings, and comparisons
- Includes trend analysis and growth indicators

### 📄 Four Major Sections

#### Section 1: Executive Summary
- Period overview with team metrics
- Top performers identification (highest revenue, most appointments, best efficiency, etc.)
- Complete payroll summary table
- Key insights and actionable alerts

#### Section 2: Individual Staff Profiles
For each staff member:
- Performance scorecard with 6-month trends
- Detailed operational statistics
- Service and product performance breakdown
- Complete payroll breakdown with commission tiers
- Team rankings and percentile comparisons
- Performance tier status and progress
- Strengths and improvement areas
- Booking patterns and customer demographics
- Goals and action items
- Manager notes section with signature line

#### Section 3: Team Comparative Analysis
- Staff performance matrix (side-by-side comparison)
- Distribution charts (revenue, tiers, workload, payroll)
- Performance quadrant analysis:
  - Star Performers (high revenue, high retention)
  - Revenue Drivers (high revenue, needs retention support)
  - Loyal Need Growth (high retention, needs revenue growth)
  - Needs Improvement (both metrics need attention)

#### Section 4: Insights & Recommendations
- Strategic insights (team strengths and improvement areas)
- Immediate actionable recommendations
- Strategic initiatives for next quarter
- Staffing recommendations based on capacity and utilization
- Payroll approval section with signature lines

## File Structure

```
lib/reports/
├── staffReportEngine.ts       # Main data aggregation engine
└── htmlTemplateGenerator.ts   # HTML/CSS template for PDF generation

app/api/staff-report/
└── route.ts                   # API endpoint (GET and POST)

app/admin/staff-report/
└── page.tsx                   # Admin page wrapper

components/
└── StaffReportGenerator.tsx   # Report generation UI
```

## Architecture

### StaffReportEngine Class

**Location:** `lib/reports/staffReportEngine.ts`

**Key Methods:**
- `generateCompleteReport(period)` - Main entry point, generates entire report
- `generateExecutiveSummary(period)` - Section 1 data
- `generateStaffProfiles(period)` - Section 2 data (all staff)
- `generateTeamComparison(period)` - Section 3 data
- `generateInsightsRecommendations(period)` - Section 4 data

**Data Sources:**
- Supabase tables: staff, appointments, appointment_services, appointment_products
- PayrollEngine: commission calculations, bonuses, deductions
- AnalyticsEngine: revenue metrics, customer metrics, operational metrics

### HTMLTemplateGenerator Class

**Location:** `lib/reports/htmlTemplateGenerator.ts`

**Purpose:** Converts report data into print-ready HTML

**Features:**
- Responsive CSS optimized for A4 printing
- Page break controls for proper PDF generation
- Color-coded metrics (green/yellow/red)
- Professional styling with gradients and cards
- Charts and tables with proper formatting

## Usage

### For Administrators

1. **Navigate to Report Page:**
   ```
   /admin/staff-report
   ```

2. **Select Period:**
   - Choose month (January - December)
   - Choose year (current and previous 4 years)

3. **Generate Report:**
   - Click "Generate & View Report (HTML)" to open in new tab
   - Or click "Download Data (JSON)" for raw data

4. **Save as PDF:**
   - In the new tab, press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
   - Select "Save as PDF" as the destination
   - Click Save

### API Usage

**Endpoint:** `/api/staff-report`

**POST Request:**
```json
{
  "month": 12,
  "year": 2024,
  "format": "html"  // or "json"
}
```

**Response (HTML format):**
```html
<!DOCTYPE html>
<html>
<!-- Complete formatted report -->
</html>
```

**Response (JSON format):**
```json
{
  "success": true,
  "data": {
    "executiveSummary": {...},
    "staffProfiles": [...],
    "teamComparison": {...},
    "insights": {...},
    "generatedAt": "2024-12-24T..."
  }
}
```

**GET Request:**
Returns current month report in JSON format

## Report Metrics Explained

### Performance Score
Calculated from 0-100 based on:
- Revenue performance (40 points max)
- Appointment volume (30 points max)
- Completion rate (30 points max)

### Performance Tiers
Based on `performance_tiers` table:
- **Platinum:** Top tier (highest revenue threshold)
- **Gold:** High performer
- **Silver:** Average performer
- **Bronze:** Entry level

### Rankings
Each staff member is ranked among all staff in:
- Revenue generated
- Number of appointments
- Efficiency (revenue per hour)
- Customer retention rate

Percentile shows what % of team they outperform (e.g., 90th percentile = top 10%)

### Payroll Breakdown

**Commission Tiers:**
Based on revenue thresholds from `staff_commission_tiers` table:
- Tier 1: $0 - $5,000 @ 10%
- Tier 2: $5,001 - $10,000 @ 12%
- Tier 3: $10,001+ @ 15%

**Product Commissions:**
Configurable rate from `payroll_settings` (default 10%)

**Bonuses:**
- Performance bonuses (from tier achievement)
- Retention bonuses (repeat customer bonuses)
- Individual bonuses (one-time rewards)
- Team bonuses (shared among all staff)

## Customization

### Changing Commission Rates
Update in `/admin/payroll-settings`:
- `product_commission_rate` - Product sales commission %
- Commission tiers in `/admin/performance-tiers`

### Modifying Report Sections
Edit `lib/reports/htmlTemplateGenerator.ts`:
- `generateExecutiveSummary()` - Section 1 HTML
- `generateStaffProfile()` - Section 2 HTML
- `generateTeamComparison()` - Section 3 HTML
- `generateInsightsRecommendations()` - Section 4 HTML

### Styling Changes
Modify the `generateStyles()` method in `htmlTemplateGenerator.ts`

### Additional Metrics
Add to `StaffReportEngine` methods:
1. Query additional data from Supabase
2. Calculate new metrics
3. Add to interface definitions
4. Include in HTML templates

## Performance Considerations

### Data Volume
- Report generation queries multiple tables
- Uses Promise.all() for parallel data fetching
- Optimized SQL queries with specific selects

### Caching Strategy
- Reports are generated on-demand (not cached)
- Consider implementing Redis cache for frequently accessed periods
- Store generated reports in database for historical access

### Optimization Tips
1. **Limit Date Range:** Reports work best for 1 month periods
2. **Off-Peak Generation:** Generate large reports during low-traffic hours
3. **Progressive Loading:** Consider splitting into sections for very large teams (50+ staff)

## Troubleshooting

### Report Generation Fails
**Error:** "Failed to generate report"
- Check database connection
- Verify all required tables exist
- Check console logs for specific error

### Missing Data
**Empty sections or $0 values**
- Verify appointments exist for the selected period
- Check that `appointment_services` junction table has data
- Ensure staff are marked as `is_active = true`

### PDF Formatting Issues
**Page breaks in wrong places**
- Use `no-break` class in HTML template for elements that shouldn't split
- Adjust `@page` settings in CSS

**Charts not visible**
- Ensure browser supports print preview
- Use Chrome or Edge for best PDF generation results

### Performance Issues
**Report takes too long to generate**
- Check database indexes on `appointment_date`, `staff_id`
- Reduce date range to 1 month
- Consider pagination for teams > 20 staff

## Database Requirements

### Required Tables
- `staff` - Staff member information
- `appointments` - Booking records
- `appointment_services` - Service-appointment junction
- `appointment_products` - Product-appointment junction
- `services` - Service catalog
- `products` - Product catalog
- `service_categories` - Service categorization
- `staff_payrolls` - Payroll records
- `performance_tiers` - Performance tier definitions
- `payroll_settings` - Configurable payroll parameters

### Required Migrations
Run these migrations in order:
1. `create_payroll_system.sql`
2. `create_payroll_settings.sql`
3. `add_multiple_services_support.sql`

## Security

### Access Control
- Only admins can access `/admin/staff-report`
- API endpoint requires authentication + admin check
- Row Level Security (RLS) applies to all queries

### Data Privacy
- Reports contain sensitive payroll information
- Only generate for authorized personnel
- Consider implementing report access logs
- Do not store generated PDFs in public directories

## Future Enhancements

### Planned Features
1. **Email Distribution:** Auto-send individual staff reports via email
2. **Report Scheduling:** Generate monthly reports automatically
3. **Comparison Mode:** Compare current vs previous period
4. **Custom Date Ranges:** Support quarterly/annual reports
5. **Export to Excel:** Generate spreadsheet version
6. **Report Templates:** Multiple report styles (detailed, summary, executive)
7. **Historical Archive:** Store and retrieve past reports
8. **Interactive Charts:** Add D3.js or Chart.js visualizations

### Suggested Improvements
1. Add customer satisfaction scores (if review system exists)
2. Include attendance tracking (if time-tracking implemented)
3. Add skill certifications/training completion tracking
4. Include sales targets vs actual achievement
5. Add team collaboration metrics
6. Include customer feedback/complaints

## Testing

### Manual Testing Steps
1. Navigate to `/admin/staff-report`
2. Select previous month (to ensure data exists)
3. Click "Generate & View Report"
4. Verify all sections appear
5. Check that staff names appear correctly
6. Verify payroll calculations match `/admin/payroll`
7. Test PDF generation (Ctrl+P)
8. Verify page breaks are appropriate
9. Test JSON download
10. Check mobile responsiveness of admin UI

### Sample Test Data
To test with sample data:
1. Ensure at least 3-5 active staff members exist
2. Create 20+ appointments in the test period
3. Mark appointments as 'completed'
4. Add services and products to appointments
5. Run payroll calculation for the period
6. Generate report and verify calculations

## Support

### Common Questions

**Q: Can I generate reports for future months?**
A: Yes, but they will show zero/empty data until appointments are completed.

**Q: How far back can I generate reports?**
A: As far back as your appointment data exists.

**Q: Can individual staff view their own reports?**
A: Currently admin-only. Consider implementing staff-specific view with filtered data.

**Q: Does this replace the payroll system?**
A: No, it complements it. Use `/admin/payroll` for approval, this for comprehensive review.

**Q: Can I customize which sections appear?**
A: Yes, edit the HTML template generator to comment out sections you don't need.

### Getting Help
- Check console logs for error messages
- Review `PAYROLL_SYSTEM.md` for payroll calculation details
- See `BUSINESS_INTELLIGENCE.md` for analytics metrics
- Refer to `CLAUDE.md` for overall system architecture

## Changelog

### Version 1.0.0 (December 2024)
- Initial implementation
- All 4 report sections
- HTML and JSON export
- Print-to-PDF functionality
- Performance scorecard with 6 metrics
- Payroll breakdown with commission tiers
- Team comparison with quadrant analysis
- Insights and recommendations engine

---

**Note:** This is a comprehensive reporting system. Ensure you have sufficient appointment and payroll data for meaningful reports. For best results, run reports after completing payroll processing for the period.
