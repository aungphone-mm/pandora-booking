'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function StaffReportGenerator() {
  const [loading, setLoading] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [reportGenerated, setReportGenerated] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const handleViewReport = async () => {
    setLoading(true)
    setError(null)
    setReportGenerated(false)

    try {
      const response = await fetch('/api/staff-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          format: 'html'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      // Open HTML in new window for viewing
      const html = await response.text()
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(html)
        newWindow.document.close()
      }

      setReportGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setLoadingExcel(true)
    setError(null)

    try {
      // Fetch report data as JSON
      const response = await fetch('/api/staff-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          format: 'json'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      const { data: report } = await response.json()

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Sheet 1: Executive Summary
      const summaryData = [
        ['PANDORA BEAUTY SALON - STAFF PERFORMANCE & PAYROLL REPORT'],
        [`Period: ${getMonthName(selectedMonth)} ${selectedYear}`],
        [''],
        ['TEAM OVERVIEW'],
        ['Total Staff', report.executiveSummary.totalStaff],
        ['Total Payroll', `$${report.executiveSummary.totalPayroll.toLocaleString()}`],
        ['Total Revenue', `$${report.executiveSummary.totalRevenue.toLocaleString()}`],
        ['Team Completion Rate', `${report.executiveSummary.teamCompletionRate.toFixed(1)}%`],
        [''],
        ['TOP PERFORMERS'],
        ...report.executiveSummary.topPerformers.map((p: any) => [
          p.type.toUpperCase(),
          p.staffName,
          p.displayValue
        ]),
        [''],
        ['PAYROLL SUMMARY'],
        ['Staff Name', 'Base Pay', 'Commissions', 'Bonuses', 'Deductions', 'Net Pay', 'Status'],
        ...report.executiveSummary.payrollSummary.map((row: any) => [
          row.staffName,
          row.basePay,
          row.commissions,
          row.bonuses,
          row.deductions,
          row.netPay,
          row.status.toUpperCase()
        ])
      ]
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, ws1, 'Executive Summary')

      // Sheet 2: Staff Performance Matrix
      const matrixData = [
        ['STAFF PERFORMANCE MATRIX'],
        ['Staff', 'Revenue', 'Appointments', '$/Appt', '$/Hr', 'Retention', 'Tier', 'Net Pay'],
        ...report.teamComparison.performanceMatrix.map((m: any) => [
          m.staffName,
          m.revenue,
          m.appointments,
          m.revenuePerAppt.toFixed(2),
          m.revenuePerHour.toFixed(2),
          m.retention.toFixed(1) + '%',
          m.tier,
          m.netPay
        ])
      ]
      const ws2 = XLSX.utils.aoa_to_sheet(matrixData)
      XLSX.utils.book_append_sheet(wb, ws2, 'Team Performance')

      // Sheet 3-N: Individual Staff Profiles
      report.staffProfiles.forEach((profile: any, index: number) => {
        const profileData = [
          [profile.staffName.toUpperCase()],
          [`Position: ${profile.position} | Tier: ${profile.performanceTier}`],
          [''],
          ['PERFORMANCE METRICS'],
          ['Metric', 'Value', 'Trend'],
          ['Revenue Generated', `$${profile.metrics.revenueGenerated.toLocaleString()}`, `${profile.metrics.revenueTrend > 0 ? '+' : ''}${profile.metrics.revenueTrend}%`],
          ['Appointments', profile.metrics.appointments, `${profile.metrics.appointmentsTrend > 0 ? '+' : ''}${profile.metrics.appointmentsTrend}%`],
          ['Completion Rate', `${profile.metrics.completionRate.toFixed(1)}%`, ''],
          ['Customer Retention', `${profile.metrics.customerRetention.toFixed(1)}%`, `${profile.metrics.retentionTrend > 0 ? '+' : ''}${profile.metrics.retentionTrend}%`],
          ['Avg Revenue/Appt', `$${profile.metrics.avgRevenuePerAppt.toFixed(2)}`, `${profile.metrics.avgRevenuePerApptTrend > 0 ? '+' : ''}${profile.metrics.avgRevenuePerApptTrend}%`],
          ['Revenue per Hour', `$${profile.metrics.revenuePerHour.toFixed(2)}`, `${profile.metrics.revenuePerHourTrend > 0 ? '+' : ''}${profile.metrics.revenuePerHourTrend}%`],
          [''],
          ['PAYROLL BREAKDOWN'],
          ['Item', 'Amount'],
          ['Base Salary', `$${profile.payrollBreakdown.baseSalary.toFixed(2)}`],
          ['Service Commissions', `$${profile.payrollBreakdown.totalServiceCommissions.toFixed(2)}`],
          ['Product Commissions', `$${profile.payrollBreakdown.productCommissions.toFixed(2)}`],
          ['Performance Bonuses', `$${profile.payrollBreakdown.totalPerformanceBonuses.toFixed(2)}`],
          ['Individual Bonuses', `$${profile.payrollBreakdown.totalIndividualBonuses.toFixed(2)}`],
          ['Team Bonuses', `$${profile.payrollBreakdown.totalTeamBonuses.toFixed(2)}`],
          ['GROSS PAY', `$${profile.payrollBreakdown.grossPay.toFixed(2)}`],
          ['Deductions', `-$${profile.payrollBreakdown.totalDeductions.toFixed(2)}`],
          ['NET PAY', `$${profile.payrollBreakdown.netPay.toFixed(2)}`],
          [''],
          ['SERVICE PERFORMANCE'],
          ['Category', 'Bookings', 'Revenue', 'Avg Price', '% of Total'],
          ...profile.servicePerformance.map((s: any) => [
            s.category,
            s.bookings,
            s.revenue.toFixed(2),
            s.avgPrice.toFixed(2),
            s.percentOfTotal.toFixed(1) + '%'
          ])
        ]

        const wsProfile = XLSX.utils.aoa_to_sheet(profileData)
        const sheetName = profile.staffName.substring(0, 31) // Excel sheet name limit
        XLSX.utils.book_append_sheet(wb, wsProfile, sheetName)
      })

      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `staff-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setReportGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingExcel(false)
    }
  }

  const getMonthName = (month: number): string => {
    const names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    return names[month - 1]
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Report Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleViewReport}
            disabled={loading || loadingExcel}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Report...
              </span>
            ) : (
              <>🖥️ View Report (HTML)</>
            )}
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={loading || loadingExcel}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {loadingExcel ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Excel...
              </span>
            ) : (
              <>📊 Download Excel Report</>
            )}
          </button>
        </div>

        {/* Success Message */}
        {reportGenerated && !loadingExcel && !loading && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Report generated successfully!
            </p>
            <p className="text-green-700 text-sm mt-1">
              💡 The report has been opened in a new tab. You can print it to PDF using Ctrl+P if needed.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}
      </div>

      {/* Report Information Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          📋 Report Contents
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Section 1: Executive Summary</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Period overview with key metrics</li>
              <li>• Top performers identification</li>
              <li>• Team payroll summary table</li>
              <li>• Key insights and alerts</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Section 2: Individual Staff Profiles</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Performance scorecard with trends</li>
              <li>• Detailed operational metrics</li>
              <li>• Complete payroll breakdown</li>
              <li>• Rankings and comparisons</li>
              <li>• Strengths & improvement areas</li>
              <li>• Goals and action items</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Section 3: Team Analysis</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Staff performance matrix</li>
              <li>• Distribution charts</li>
              <li>• Performance quadrant analysis</li>
              <li>• Team comparisons</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Section 4: Insights & Recommendations</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Strategic insights</li>
              <li>• Actionable recommendations</li>
              <li>• Staffing recommendations</li>
              <li>• Payroll approval section</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          📖 How to Use This Report
        </h2>

        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <strong>Select Period:</strong> Choose the month and year for the report
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <strong>Choose Format:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li><strong className="text-blue-600">🖥️ HTML View</strong> - Opens formatted report in new tab for viewing (you can print to PDF manually with Ctrl+P)</li>
                <li><strong className="text-green-600">📊 Excel Report</strong> - Spreadsheet format with multiple sheets for data analysis and custom calculations</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <strong>View HTML Report:</strong> Click "View Report (HTML)" to open the formatted report in a new browser tab for reviewing
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">4️⃣</span>
            <div>
              <strong>Download Excel:</strong> Click "Download Excel Report" - file downloads automatically to your Downloads folder
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">5️⃣</span>
            <div>
              <strong>Optional PDF:</strong> If you need PDF, open HTML report and press Ctrl+P (Windows) or Cmd+P (Mac), then select "Save as PDF"
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">6️⃣</span>
            <div>
              <strong>Use & Share:</strong> Share HTML reports for viewing, use Excel for data analysis, or create PDFs for archiving
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>💡 Pro Tip:</strong> Use <strong>HTML</strong> for quick viewing and optional PDF printing. Use <strong>Excel</strong> for detailed data analysis, custom calculations, and pivot tables.
          </p>
        </div>
      </div>

      {/* Report Features */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          ✨ Report Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-3xl mb-2">🖥️</div>
            <h3 className="font-semibold text-gray-800 mb-1">HTML View</h3>
            <p className="text-sm text-gray-600">
              Professional formatted report with visual charts, color-coded metrics, and polished design. Optionally save as PDF.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800 mb-1">Excel Export</h3>
            <p className="text-sm text-gray-600">
              Multi-sheet workbook with executive summary, team matrix, and individual staff profiles for data analysis
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-gray-800 mb-1">Comprehensive Data</h3>
            <p className="text-sm text-gray-600">
              All performance metrics, payroll details, and analytics in one complete report
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-semibold text-gray-800 mb-1">Actionable Insights</h3>
            <p className="text-sm text-gray-600">
              Strategic recommendations, improvement areas, and next-period goals
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-800 mb-1">Payroll Verification</h3>
            <p className="text-sm text-gray-600">
              Transparent commission tiers, bonus breakdowns, and approval sections
            </p>
          </div>

          <div className="p-4 bg-pink-50 rounded-lg">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-800 mb-1">Team Analytics</h3>
            <p className="text-sm text-gray-600">
              Performance rankings, quadrant analysis, and peer comparisons
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
