/**
 * HTML Template Generator for Staff Reports
 * Generates print-ready HTML that can be converted to PDF
 */

import { CompleteStaffReport, StaffProfile, ExecutiveSummary } from './staffReportEngine'

export class HTMLTemplateGenerator {
  /**
   * Generate complete HTML document for the report
   */
  generateReportHTML(report: CompleteStaffReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staff Performance & Payroll Report - ${report.executiveSummary.period.month}/${report.executiveSummary.period.year}</title>
  ${this.generateStyles()}
</head>
<body>
  ${this.generateCoverPage(report.executiveSummary)}
  ${this.generateExecutiveSummary(report.executiveSummary)}
  ${report.staffProfiles.map(profile => this.generateStaffProfile(profile)).join('\n')}
  ${this.generateTeamComparison(report)}
  ${this.generateInsightsRecommendations(report)}
</body>
</html>
    `
  }

  /**
   * CSS Styles for print
   */
  private generateStyles(): string {
    return `
<style>
  @media print {
    @page {
      size: A4;
      margin: 1cm;
    }
    .page-break {
      page-break-after: always;
    }
    .no-break {
      page-break-inside: avoid;
    }
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #333;
  }

  .cover-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .cover-page h1 {
    font-size: 36pt;
    margin-bottom: 20px;
  }

  .cover-page h2 {
    font-size: 24pt;
    margin-bottom: 10px;
  }

  .cover-page p {
    font-size: 14pt;
  }

  h1 {
    font-size: 24pt;
    margin-bottom: 15px;
    color: #667eea;
    border-bottom: 3px solid #667eea;
    padding-bottom: 10px;
  }

  h2 {
    font-size: 18pt;
    margin-top: 20px;
    margin-bottom: 10px;
    color: #764ba2;
  }

  h3 {
    font-size: 14pt;
    margin-top: 15px;
    margin-bottom: 8px;
    color: #555;
  }

  .section {
    margin-bottom: 30px;
  }

  .card {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9f9f9;
  }

  .header-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 9pt;
  }

  th {
    background: #667eea;
    color: white;
    padding: 10px;
    text-align: left;
    font-weight: bold;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #ddd;
  }

  tr:nth-child(even) {
    background: #f5f5f5;
  }

  .metric-box {
    display: inline-block;
    background: white;
    border: 2px solid #667eea;
    border-radius: 8px;
    padding: 15px;
    margin: 10px;
    min-width: 200px;
    text-align: center;
  }

  .metric-value {
    font-size: 24pt;
    font-weight: bold;
    color: #667eea;
  }

  .metric-label {
    font-size: 10pt;
    color: #666;
    margin-top: 5px;
  }

  .trend-up {
    color: #10b981;
  }

  .trend-down {
    color: #ef4444;
  }

  .trend-stable {
    color: #6b7280;
  }

  .status-approved {
    color: #10b981;
    font-weight: bold;
  }

  .status-pending {
    color: #f59e0b;
    font-weight: bold;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: bold;
  }

  .badge-gold {
    background: #fbbf24;
    color: #92400e;
  }

  .badge-silver {
    background: #d1d5db;
    color: #374151;
  }

  .badge-bronze {
    background: #f97316;
    color: white;
  }

  .performance-score {
    font-size: 32pt;
    font-weight: bold;
    color: #667eea;
  }

  .stars {
    color: #fbbf24;
    font-size: 18pt;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s;
  }

  .quadrant {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin: 20px 0;
  }

  .quadrant-box {
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    min-height: 150px;
  }

  .quadrant-box h4 {
    margin-bottom: 10px;
    color: #667eea;
  }

  .insight-item {
    padding: 10px;
    margin: 10px 0;
    border-left: 4px solid #667eea;
    background: #f0f4ff;
  }

  .warning {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  .success {
    border-left-color: #10b981;
    background: #f0fdf4;
  }

  .info {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  ul {
    margin-left: 20px;
    margin-top: 10px;
  }

  li {
    margin: 5px 0;
  }

  .payroll-breakdown {
    background: #f9fafb;
    border: 2px solid #667eea;
    border-radius: 8px;
    padding: 20px;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
  }

  .payroll-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px dashed #ddd;
  }

  .payroll-total {
    font-weight: bold;
    font-size: 12pt;
    border-top: 3px double #333;
    border-bottom: 3px double #333;
    padding: 10px 0;
    margin-top: 10px;
  }

  .signature-box {
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-top: 30px;
    min-height: 150px;
  }

  .signature-line {
    border-bottom: 1px solid #333;
    display: inline-block;
    min-width: 200px;
    margin: 0 10px;
  }
</style>
    `
  }

  /**
   * Cover Page
   */
  private generateCoverPage(summary: ExecutiveSummary): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `
<div class="cover-page page-break">
  <h1>📊 Staff Performance & Payroll Report</h1>
  <h2>Pandora Beauty Salon</h2>
  <p style="font-size: 18pt; margin-top: 30px;">${monthNames[summary.period.month - 1]} ${summary.period.year}</p>
  <p style="margin-top: 20px;">Generated: ${new Date().toLocaleDateString()}</p>
  <div style="margin-top: 50px;">
    <div class="metric-box" style="background: rgba(255,255,255,0.9); color: #333;">
      <div class="metric-value">${summary.totalStaff}</div>
      <div class="metric-label">Staff Members</div>
    </div>
    <div class="metric-box" style="background: rgba(255,255,255,0.9); color: #333;">
      <div class="metric-value">$${summary.totalRevenue.toLocaleString()}</div>
      <div class="metric-label">Total Revenue</div>
    </div>
    <div class="metric-box" style="background: rgba(255,255,255,0.9); color: #333;">
      <div class="metric-value">$${summary.totalPayroll.toLocaleString()}</div>
      <div class="metric-label">Total Payroll</div>
    </div>
  </div>
</div>
    `
  }

  /**
   * Executive Summary (Section 1)
   */
  private generateExecutiveSummary(summary: ExecutiveSummary): string {
    return `
<div class="section page-break">
  <h1>📋 Executive Summary</h1>

  <div class="header-box">
    <h2 style="color: white; margin-top: 0;">Period Overview</h2>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px;">
      <div>
        <div style="font-size: 24pt; font-weight: bold;">${summary.totalStaff}</div>
        <div>Total Staff</div>
      </div>
      <div>
        <div style="font-size: 24pt; font-weight: bold;">$${summary.totalPayroll.toLocaleString()}</div>
        <div>Total Payroll</div>
      </div>
      <div>
        <div style="font-size: 24pt; font-weight: bold;">$${summary.totalRevenue.toLocaleString()}</div>
        <div>Total Revenue</div>
      </div>
      <div>
        <div style="font-size: 24pt; font-weight: bold;">${summary.teamCompletionRate.toFixed(1)}%</div>
        <div>Completion Rate</div>
      </div>
    </div>
  </div>

  <h2>🏆 Top Performers</h2>
  <div class="card">
    ${summary.topPerformers.map(tp => `
      <div style="padding: 10px; border-bottom: 1px solid #ddd;">
        <strong>${this.getPerformerIcon(tp.type)} ${this.getPerformerTitle(tp.type)}:</strong>
        ${tp.staffName} - ${tp.displayValue}
      </div>
    `).join('')}
  </div>

  <h2>💰 Payroll Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Staff Name</th>
        <th>Base Pay</th>
        <th>Commissions</th>
        <th>Bonuses</th>
        <th>Deductions</th>
        <th>Net Pay</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${summary.payrollSummary.map(row => `
        <tr>
          <td><strong>${row.staffName}</strong></td>
          <td>$${row.basePay.toLocaleString()}</td>
          <td>$${row.commissions.toLocaleString()}</td>
          <td>$${row.bonuses.toLocaleString()}</td>
          <td>$${row.deductions.toLocaleString()}</td>
          <td><strong>$${row.netPay.toLocaleString()}</strong></td>
          <td class="status-${row.status}">${row.status.toUpperCase()}</td>
        </tr>
      `).join('')}
      <tr style="background: #f0f4ff; font-weight: bold;">
        <td>TOTAL</td>
        <td>$${summary.payrollSummary.reduce((s, r) => s + r.basePay, 0).toLocaleString()}</td>
        <td>$${summary.payrollSummary.reduce((s, r) => s + r.commissions, 0).toLocaleString()}</td>
        <td>$${summary.payrollSummary.reduce((s, r) => s + r.bonuses, 0).toLocaleString()}</td>
        <td>$${summary.payrollSummary.reduce((s, r) => s + r.deductions, 0).toLocaleString()}</td>
        <td>$${summary.payrollSummary.reduce((s, r) => s + r.netPay, 0).toLocaleString()}</td>
        <td>-</td>
      </tr>
    </tbody>
  </table>

  <h2>💡 Key Insights</h2>
  ${summary.keyInsights.map(insight => `
    <div class="insight-item ${insight.type}">
      <strong>${insight.icon} ${insight.message}</strong>
      ${insight.staffName ? `<br><small>Staff: ${insight.staffName}</small>` : ''}
    </div>
  `).join('')}
</div>
    `
  }

  /**
   * Individual Staff Profile (Section 2)
   */
  private generateStaffProfile(profile: StaffProfile): string {
    return `
<div class="section page-break">
  <div class="header-box">
    <h1 style="color: white; margin-top: 0; border: none; padding: 0;">👤 ${profile.staffName}</h1>
    <p style="margin-top: 10px;">Position: ${profile.position} | Performance Tier: <span class="badge badge-${profile.performanceTier.toLowerCase()}">${profile.performanceTier}</span></p>
  </div>

  <h2>📊 Performance Scorecard</h2>
  <div class="card">
    <div style="text-align: center;">
      <div class="performance-score">${profile.performanceScore}/100</div>
      <div class="stars">${this.generateStars(profile.performanceScore)}</div>
    </div>
    <table style="margin-top: 20px;">
      <tr>
        <td><strong>Revenue Generated:</strong></td>
        <td>$${profile.metrics.revenueGenerated.toLocaleString()}</td>
        <td class="${this.getTrendClass(profile.metrics.revenueTrend)}">${this.getTrendArrow(profile.metrics.revenueTrend)} ${Math.abs(profile.metrics.revenueTrend)}%</td>
      </tr>
      <tr>
        <td><strong>Appointments:</strong></td>
        <td>${profile.metrics.appointments}</td>
        <td class="${this.getTrendClass(profile.metrics.appointmentsTrend)}">${this.getTrendArrow(profile.metrics.appointmentsTrend)} ${Math.abs(profile.metrics.appointmentsTrend)}%</td>
      </tr>
      <tr>
        <td><strong>Completion Rate:</strong></td>
        <td>${profile.metrics.completionRate.toFixed(1)}%</td>
        <td class="${this.getTrendClass(profile.metrics.completionTrend)}">${this.getTrendArrow(profile.metrics.completionTrend)}</td>
      </tr>
      <tr>
        <td><strong>Customer Retention:</strong></td>
        <td>${profile.metrics.customerRetention.toFixed(1)}%</td>
        <td class="${this.getTrendClass(profile.metrics.retentionTrend)}">${this.getTrendArrow(profile.metrics.retentionTrend)} ${Math.abs(profile.metrics.retentionTrend)}%</td>
      </tr>
      <tr>
        <td><strong>Avg Revenue/Appt:</strong></td>
        <td>$${profile.metrics.avgRevenuePerAppt.toFixed(2)}</td>
        <td class="${this.getTrendClass(profile.metrics.avgRevenuePerApptTrend)}">${this.getTrendArrow(profile.metrics.avgRevenuePerApptTrend)} ${Math.abs(profile.metrics.avgRevenuePerApptTrend)}%</td>
      </tr>
      <tr>
        <td><strong>Revenue per Hour:</strong></td>
        <td>$${profile.metrics.revenuePerHour.toFixed(2)}</td>
        <td class="${this.getTrendClass(profile.metrics.revenuePerHourTrend)}">${this.getTrendArrow(profile.metrics.revenuePerHourTrend)} ${Math.abs(profile.metrics.revenuePerHourTrend)}%</td>
      </tr>
    </table>
  </div>

  ${this.generateServicePerformance(profile)}
  ${this.generatePayrollBreakdown(profile)}
  ${this.generateStrengthsImprovements(profile)}
  ${this.generateGoalsActions(profile)}
</div>
    `
  }

  private generateServicePerformance(profile: StaffProfile): string {
    if (profile.servicePerformance.length === 0) return ''

    return `
  <h2>🎯 Service Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Service Category</th>
        <th>Bookings</th>
        <th>Revenue</th>
        <th>Avg Price</th>
        <th>% of Total</th>
      </tr>
    </thead>
    <tbody>
      ${profile.servicePerformance.map(service => `
        <tr>
          <td>${service.category}</td>
          <td>${service.bookings}</td>
          <td>$${service.revenue.toFixed(2)}</td>
          <td>$${service.avgPrice.toFixed(2)}</td>
          <td>${service.percentOfTotal.toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
    `
  }

  private generatePayrollBreakdown(profile: StaffProfile): string {
    return `
  <h2 class="no-break">💰 Payroll Breakdown</h2>
  <div class="payroll-breakdown no-break">
    <div class="payroll-row">
      <span>1. Base Salary</span>
      <span>$${profile.payrollBreakdown.baseSalary.toFixed(2)}</span>
    </div>
    <div class="payroll-row">
      <span>2. Service Commissions</span>
      <span>$${profile.payrollBreakdown.totalServiceCommissions.toFixed(2)}</span>
    </div>
    <div class="payroll-row">
      <span>3. Product Commissions (${profile.payrollBreakdown.productCommissionRate}%)</span>
      <span>$${profile.payrollBreakdown.productCommissions.toFixed(2)}</span>
    </div>
    <div class="payroll-row">
      <span>4. Performance Bonuses</span>
      <span>$${profile.payrollBreakdown.totalPerformanceBonuses.toFixed(2)}</span>
    </div>
    <div class="payroll-row">
      <span>5. Individual Bonuses</span>
      <span>$${profile.payrollBreakdown.totalIndividualBonuses.toFixed(2)}</span>
    </div>
    <div class="payroll-row">
      <span>6. Team Bonuses</span>
      <span>$${profile.payrollBreakdown.totalTeamBonuses.toFixed(2)}</span>
    </div>
    <div class="payroll-row" style="font-weight: bold;">
      <span>7. GROSS PAY</span>
      <span>$${profile.payrollBreakdown.grossPay.toFixed(2)}</span>
    </div>
    <div class="payroll-row">
      <span>8. Deductions</span>
      <span>-$${profile.payrollBreakdown.totalDeductions.toFixed(2)}</span>
    </div>
    ${profile.payrollBreakdown.totalAdjustments !== 0 ? `
    <div class="payroll-row">
      <span>9. Adjustments</span>
      <span>${profile.payrollBreakdown.totalAdjustments > 0 ? '+' : ''}$${profile.payrollBreakdown.totalAdjustments.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="payroll-row payroll-total">
      <span>💰 NET PAY</span>
      <span>$${profile.payrollBreakdown.netPay.toFixed(2)}</span>
    </div>
  </div>
    `
  }

  private generateStrengthsImprovements(profile: StaffProfile): string {
    return `
  <h2>✅ Top Strengths</h2>
  <div class="card success">
    ${profile.strengths.map((s, i) => `
      <div style="margin-bottom: 10px;">
        <strong>${i + 1}. ${s.title}</strong> - ${s.description}
      </div>
    `).join('')}
  </div>

  <h2>📈 Growth Opportunities</h2>
  <div class="card warning">
    ${profile.improvements.map((imp, i) => `
      <div style="margin-bottom: 10px;">
        <strong>${i + 1}. ${imp.title}</strong><br>
        ${imp.description}<br>
        <em>Action: ${imp.action}</em>
      </div>
    `).join('')}
  </div>
    `
  }

  private generateGoalsActions(profile: StaffProfile): string {
    return `
  <h2>🎯 Goals for Next Period</h2>
  <div class="card">
    ${profile.goals.map((goal, i) => `
      <div class="payroll-row">
        <span>${i + 1}. ${goal.category}:</span>
        <span>${goal.target} (${goal.increase})</span>
      </div>
    `).join('')}
  </div>

  <h2>✓ Action Items</h2>
  <div class="card">
    <ul>
      ${profile.actionItems.map(item => `
        <li>☐ ${item.task}</li>
      `).join('')}
    </ul>
  </div>

  <div class="signature-box">
    <h3>Manager Notes:</h3>
    <div style="min-height: 80px; margin: 15px 0;">${profile.managerNotes || '[Space for notes]'}</div>
    <div style="margin-top: 20px;">
      <span>Manager Signature: <span class="signature-line"></span></span>
      <span style="margin-left: 30px;">Date: <span class="signature-line"></span></span>
    </div>
  </div>
    `
  }

  /**
   * Team Comparison (Section 3)
   */
  private generateTeamComparison(report: CompleteStaffReport): string {
    const { teamComparison } = report

    return `
<div class="section page-break">
  <h1>👥 Team Comparative Analysis</h1>

  <h2>📊 Staff Performance Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Staff</th>
        <th>Revenue</th>
        <th>Appts</th>
        <th>$/Appt</th>
        <th>$/Hr</th>
        <th>Retention</th>
        <th>Tier</th>
        <th>Net Pay</th>
      </tr>
    </thead>
    <tbody>
      ${teamComparison.performanceMatrix.map(member => `
        <tr>
          <td><strong>${member.staffName}</strong></td>
          <td>$${member.revenue.toLocaleString()}</td>
          <td>${member.appointments}</td>
          <td>$${member.revenuePerAppt.toFixed(0)}</td>
          <td>$${member.revenuePerHour.toFixed(0)}</td>
          <td>${member.retention.toFixed(0)}%</td>
          <td><span class="badge badge-${member.tier.toLowerCase()}">${member.tier}</span></td>
          <td>$${member.netPay.toLocaleString()}</td>
        </tr>
      `).join('')}
      <tr style="background: #f0f4ff; font-weight: bold;">
        <td>AVERAGE</td>
        <td>$${(teamComparison.performanceMatrix.reduce((s, m) => s + m.revenue, 0) / teamComparison.performanceMatrix.length).toLocaleString()}</td>
        <td>${Math.round(teamComparison.performanceMatrix.reduce((s, m) => s + m.appointments, 0) / teamComparison.performanceMatrix.length)}</td>
        <td>$${(teamComparison.performanceMatrix.reduce((s, m) => s + m.revenuePerAppt, 0) / teamComparison.performanceMatrix.length).toFixed(0)}</td>
        <td>$${(teamComparison.performanceMatrix.reduce((s, m) => s + m.revenuePerHour, 0) / teamComparison.performanceMatrix.length).toFixed(0)}</td>
        <td>${(teamComparison.performanceMatrix.reduce((s, m) => s + m.retention, 0) / teamComparison.performanceMatrix.length).toFixed(0)}%</td>
        <td>-</td>
        <td>$${(teamComparison.performanceMatrix.reduce((s, m) => s + m.netPay, 0) / teamComparison.performanceMatrix.length).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <h2>🎯 Performance Quadrant Analysis</h2>
  <div class="quadrant no-break">
    <div class="quadrant-box" style="border-color: #10b981;">
      <h4 style="color: #10b981;">⭐ Star Performers</h4>
      <p style="font-size: 8pt; color: #666;">High Revenue, High Retention</p>
      <ul>
        ${teamComparison.quadrantAnalysis.starPerformers.map(name => `<li>${name}</li>`).join('')}
        ${teamComparison.quadrantAnalysis.starPerformers.length === 0 ? '<li><em>None</em></li>' : ''}
      </ul>
    </div>
    <div class="quadrant-box" style="border-color: #f59e0b;">
      <h4 style="color: #f59e0b;">💰 Revenue Drivers</h4>
      <p style="font-size: 8pt; color: #666;">High Revenue, Low Retention (Need Support)</p>
      <ul>
        ${teamComparison.quadrantAnalysis.revenueDrivers.map(name => `<li>${name}</li>`).join('')}
        ${teamComparison.quadrantAnalysis.revenueDrivers.length === 0 ? '<li><em>None</em></li>' : ''}
      </ul>
    </div>
    <div class="quadrant-box" style="border-color: #3b82f6;">
      <h4 style="color: #3b82f6;">❤️ Loyal, Need Growth</h4>
      <p style="font-size: 8pt; color: #666;">Low Revenue, High Retention</p>
      <ul>
        ${teamComparison.quadrantAnalysis.loyalNeedGrowth.map(name => `<li>${name}</li>`).join('')}
        ${teamComparison.quadrantAnalysis.loyalNeedGrowth.length === 0 ? '<li><em>None</em></li>' : ''}
      </ul>
    </div>
    <div class="quadrant-box" style="border-color: #ef4444;">
      <h4 style="color: #ef4444;">⚠️ Needs Improvement</h4>
      <p style="font-size: 8pt; color: #666;">Low Revenue, Low Retention</p>
      <ul>
        ${teamComparison.quadrantAnalysis.needsImprovement.map(name => `<li>${name}</li>`).join('')}
        ${teamComparison.quadrantAnalysis.needsImprovement.length === 0 ? '<li><em>None</em></li>' : ''}
      </ul>
    </div>
  </div>
</div>
    `
  }

  /**
   * Insights & Recommendations (Section 4)
   */
  private generateInsightsRecommendations(report: CompleteStaffReport): string {
    const { insights } = report

    return `
<div class="section page-break">
  <h1>💡 Insights & Recommendations</h1>

  <h2>🎯 Strategic Insights</h2>
  <div class="card success">
    <h3>Team Strengths:</h3>
    <ul>
      ${insights.strategicInsights.teamStrengths.map(s => `<li>${s}</li>`).join('')}
    </ul>
  </div>
  <div class="card warning">
    <h3>Areas for Improvement:</h3>
    <ul>
      ${insights.strategicInsights.areasForImprovement.map(a => `<li>${a}</li>`).join('')}
    </ul>
  </div>

  <h2>🚀 Actionable Recommendations</h2>
  <h3>Immediate Actions (This Month):</h3>
  ${insights.actionableRecommendations.immediate.map((rec, i) => `
    <div class="insight-item info">
      <strong>${i + 1}. ${rec.title}</strong><br>
      ${rec.description}
      ${rec.staffAffected ? `<br><small>Staff: ${rec.staffAffected.join(', ')}</small>` : ''}
    </div>
  `).join('')}

  <h3>Strategic Initiatives (Next Quarter):</h3>
  ${insights.actionableRecommendations.strategic.map((rec, i) => `
    <div class="insight-item">
      <strong>${i + 1}. ${rec.title}</strong><br>
      ${rec.description}
    </div>
  `).join('')}

  <h2>👥 Staffing Recommendations</h2>
  <div class="card">
    <div class="payroll-row">
      <span>Total Team Capacity:</span>
      <span>${insights.staffingRecommendations.totalCapacity} appointments/month</span>
    </div>
    <div class="payroll-row">
      <span>Current Utilization:</span>
      <span>${insights.staffingRecommendations.currentUtilization.toFixed(1)}%</span>
    </div>
    <div class="payroll-row">
      <span>Peak Capacity Stress:</span>
      <span>${insights.staffingRecommendations.peakStress}</span>
    </div>
  </div>
  <div class="card info">
    <h3>Recommendations:</h3>
    <ul>
      ${insights.staffingRecommendations.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>

  <div class="signature-box no-break" style="margin-top: 50px;">
    <h2>📝 Payroll Approval</h2>
    <div class="payroll-row">
      <span>Total Payroll Amount:</span>
      <span class="signature-line" style="min-width: 150px;"></span>
    </div>
    <div style="margin-top: 30px;">
      <div style="margin: 15px 0;">
        Prepared By: <span class="signature-line"></span> &nbsp;&nbsp; Date: <span class="signature-line" style="min-width: 100px;"></span>
      </div>
      <div style="margin: 15px 0;">
        Reviewed By: <span class="signature-line"></span> &nbsp;&nbsp; Date: <span class="signature-line" style="min-width: 100px;"></span>
      </div>
      <div style="margin: 15px 0;">
        Approved By: <span class="signature-line"></span> &nbsp;&nbsp; Date: <span class="signature-line" style="min-width: 100px;"></span>
      </div>
    </div>
    <div style="margin-top: 20px;">
      <label><input type="checkbox"> Approved for Payment</label> &nbsp;&nbsp;
      <label><input type="checkbox"> Requires Revision</label>
    </div>
    <div style="margin-top: 15px;">
      <strong>Notes:</strong><br>
      <div style="border: 1px solid #ddd; min-height: 60px; padding: 10px; margin-top: 5px;"></div>
    </div>
  </div>
</div>
    `
  }

  /**
   * Helper methods
   */
  private getPerformerIcon(type: string): string {
    const icons: { [key: string]: string } = {
      revenue: '🏆',
      appointments: '📊',
      efficiency: '⚡',
      retention: '❤️',
      improvement: '📈'
    }
    return icons[type] || '⭐'
  }

  private getPerformerTitle(type: string): string {
    const titles: { [key: string]: string } = {
      revenue: 'Highest Revenue',
      appointments: 'Most Appointments',
      efficiency: 'Best Efficiency',
      retention: 'Customer Favorite',
      improvement: 'Most Improved'
    }
    return titles[type] || 'Top Performer'
  }

  private generateStars(score: number): string {
    const fullStars = Math.floor(score / 20)
    const halfStar = (score % 20) >= 10 ? 1 : 0
    const emptyStars = 5 - fullStars - halfStar

    return '⭐'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars)
  }

  private getTrendClass(trend: number): string {
    if (trend > 0) return 'trend-up'
    if (trend < 0) return 'trend-down'
    return 'trend-stable'
  }

  private getTrendArrow(trend: number): string {
    if (trend > 0) return '↗️'
    if (trend < 0) return '↘️'
    return '➡️'
  }
}
