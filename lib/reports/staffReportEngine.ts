/**
 * Staff Report Engine
 * Generates comprehensive staff performance and payroll reports
 */

import { createClient } from '@/lib/supabase/server'
import { AnalyticsEngine } from '@/lib/analytics/engine'
import { PayrollEngine, PayrollPeriod } from '@/lib/payroll/engine'

export interface ReportPeriod {
  startDate: string
  endDate: string
  month: number
  year: number
}

export interface TopPerformer {
  type: 'revenue' | 'appointments' | 'efficiency' | 'retention' | 'improvement'
  staffId: string
  staffName: string
  value: number
  displayValue: string
}

export interface ExecutiveSummary {
  period: ReportPeriod
  totalStaff: number
  totalPayroll: number
  totalRevenue: number
  teamCompletionRate: number
  topPerformers: TopPerformer[]
  payrollSummary: PayrollSummaryRow[]
  keyInsights: KeyInsight[]
}

export interface PayrollSummaryRow {
  staffId: string
  staffName: string
  basePay: number
  commissions: number
  bonuses: number
  deductions: number
  netPay: number
  status: 'approved' | 'pending' | 'rejected'
}

export interface KeyInsight {
  type: 'warning' | 'success' | 'info' | 'action'
  icon: string
  message: string
  staffId?: string
  staffName?: string
}

export interface StaffProfile {
  // Header
  staffId: string
  staffName: string
  staffPhoto?: string
  position: string
  joinedDate: string
  performanceTier: string

  // Performance Scorecard
  performanceScore: number
  scoreBreakdown: {
    revenue: number
    appointments: number
    completion: number
    retention: number
    efficiency: number
  }
  metrics: {
    revenueGenerated: number
    revenueTrend: number
    appointments: number
    appointmentsTrend: number
    completionRate: number
    completionTrend: number
    customerRetention: number
    retentionTrend: number
    avgRevenuePerAppt: number
    avgRevenuePerApptTrend: number
    revenuePerHour: number
    revenuePerHourTrend: number
  }
  performanceTrend: TrendData[]

  // Detailed Metrics
  operationalStats: {
    totalHours: number
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    avgAppointmentsPerDay: number
    peakDay: string
    peakDayCount: number
    utilizationRate: number
  }
  servicePerformance: ServiceStats[]
  productPerformance: {
    productsSold: number
    productRevenue: number
    productCommission: number
    conversionRate: number
    topProduct: string
    topProductCount: number
  }
  customerInsights: {
    totalCustomers: number
    newCustomers: number
    newCustomersPercent: number
    returningCustomers: number
    returningCustomersPercent: number
    repeatRate: number
    loyaltyScore: number
    avgLifetimeValue: number
  }

  // Payroll
  payrollBreakdown: {
    baseSalary: number
    serviceCommissions: CommissionTier[]
    totalServiceCommissions: number
    productCommissions: number
    productCommissionRate: number
    performanceBonuses: BonusItem[]
    totalPerformanceBonuses: number
    individualBonuses: BonusItem[]
    totalIndividualBonuses: number
    teamBonuses: BonusItem[]
    totalTeamBonuses: number
    grossPay: number
    deductions: DeductionItem[]
    totalDeductions: number
    adjustments: AdjustmentItem[]
    totalAdjustments: number
    netPay: number
  }

  // Rankings
  rankings: {
    revenueRank: number
    revenuePercentile: number
    appointmentsRank: number
    appointmentsPercentile: number
    efficiencyRank: number
    efficiencyPercentile: number
    retentionRank: number
    retentionPercentile: number
  }
  comparison: ComparisonMetric[]
  tierStatus: {
    currentTier: string
    nextTier: string
    progressPercent: number
    revenueNeeded: number
    estimatedMonths: number
  }

  // Strengths & Improvements
  strengths: Strength[]
  improvements: Improvement[]

  // Appointment Analytics
  bookingPatterns: {
    busiestDay: string
    busiestDayAvg: number
    quietestDay: string
    quietestDayAvg: number
    peakHours: string
    serviceBreakdown: { [key: string]: number }
  }
  customerDemographics: {
    newVsReturning: { new: number; returning: number }
    walkInsVsBooked: { walkIn: number; booked: number }
    mostLoyalCustomer: string
    mostLoyalCustomerVisits: number
  }
  weeklyTrend: WeeklyData[]

  // Goals
  goals: Goal[]
  actionItems: ActionItem[]
  managerNotes: string
}

export interface TrendData {
  month: string
  revenue: number
  appointments: number
}

export interface ServiceStats {
  category: string
  bookings: number
  revenue: number
  avgPrice: number
  percentOfTotal: number
}

export interface CommissionTier {
  tier: string
  range: string
  revenue: number
  rate: number
  commission: number
}

export interface BonusItem {
  reason: string
  amount: number
}

export interface DeductionItem {
  type: string
  amount: number
}

export interface AdjustmentItem {
  reason: string
  amount: number
}

export interface ComparisonMetric {
  metric: string
  you: number
  teamAvg: number
  difference: number
  differencePercent: number
  status: 'above' | 'below' | 'equal'
}

export interface Strength {
  title: string
  description: string
  value: string
}

export interface Improvement {
  title: string
  description: string
  action: string
}

export interface WeeklyData {
  week: string
  appointments: number
  revenue: number
  trend: string
}

export interface Goal {
  category: string
  target: string
  increase: string
}

export interface ActionItem {
  task: string
  completed: boolean
}

export interface TeamComparison {
  performanceMatrix: TeamMemberRow[]
  distributions: {
    revenue: DistributionData[]
    tiers: TierDistribution[]
    workload: WorkloadData[]
    payroll: PayrollDistribution[]
  }
  quadrantAnalysis: {
    starPerformers: string[]
    revenueDrivers: string[]
    loyalNeedGrowth: string[]
    needsImprovement: string[]
  }
}

export interface TeamMemberRow {
  staffId: string
  staffName: string
  revenue: number
  appointments: number
  revenuePerAppt: number
  revenuePerHour: number
  retention: number
  tier: string
  netPay: number
}

export interface DistributionData {
  label: string
  value: number
  percent: number
}

export interface TierDistribution {
  tier: string
  count: number
  percent: number
}

export interface WorkloadData {
  staffName: string
  appointments: number
  percent: number
}

export interface PayrollDistribution {
  staffName: string
  amount: number
  percent: number
}

export interface InsightsRecommendations {
  strategicInsights: {
    teamStrengths: string[]
    areasForImprovement: string[]
  }
  actionableRecommendations: {
    immediate: RecommendationItem[]
    strategic: RecommendationItem[]
  }
  staffingRecommendations: {
    totalCapacity: number
    currentUtilization: number
    peakStress: string
    recommendations: string[]
  }
}

export interface RecommendationItem {
  title: string
  description: string
  staffAffected?: string[]
}

export interface CompleteStaffReport {
  executiveSummary: ExecutiveSummary
  staffProfiles: StaffProfile[]
  teamComparison: TeamComparison
  insights: InsightsRecommendations
  generatedAt: string
}

export class StaffReportEngine {
  private supabase = createClient()
  private analyticsEngine = new AnalyticsEngine()
  private payrollEngine = new PayrollEngine()

  /**
   * Generate complete staff report for a given period
   */
  async generateCompleteReport(period: ReportPeriod): Promise<CompleteStaffReport> {
    const [executiveSummary, staffProfiles, teamComparison, insights] = await Promise.all([
      this.generateExecutiveSummary(period),
      this.generateStaffProfiles(period),
      this.generateTeamComparison(period),
      this.generateInsightsRecommendations(period)
    ])

    return {
      executiveSummary,
      staffProfiles,
      teamComparison,
      insights,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * Generate Executive Summary (Section 1)
   */
  private async generateExecutiveSummary(period: ReportPeriod): Promise<ExecutiveSummary> {
    // Get all active staff
    const { data: staff } = await this.supabase
      .from('staff')
      .select('id, full_name, is_active')
      .eq('is_active', true)

    const totalStaff = staff?.length || 0

    // Get appointments in period
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select(`
        id,
        status,
        total_price,
        staff_id,
        appointment_services (
          price,
          quantity
        ),
        appointment_products (
          products (
            price
          ),
          quantity
        )
      `)
      .gte('appointment_date', period.startDate)
      .lte('appointment_date', period.endDate)

    // Calculate total revenue
    const totalRevenue = appointments?.reduce((sum, appt) => sum + (appt.total_price || 0), 0) || 0

    // Calculate completion rate
    const completedCount = appointments?.filter(a => a.status === 'completed').length || 0
    const teamCompletionRate = appointments?.length ? (completedCount / appointments.length) * 100 : 0

    // Get payroll data for all staff
    const payrollPeriod: PayrollPeriod = { month: period.month, year: period.year }
    const payrollData = await this.calculatePayrollForAllStaff(staff || [], payrollPeriod)
    const totalPayroll = payrollData.reduce((sum, p) => sum + p.calculations.netPay, 0)

    // Generate top performers
    const topPerformers = await this.identifyTopPerformers(period, appointments || [])

    // Generate payroll summary
    const payrollSummary = await this.generatePayrollSummary(payrollData)

    // Generate key insights
    const keyInsights = await this.generateKeyInsights(period, appointments || [], payrollData)

    return {
      period,
      totalStaff,
      totalPayroll,
      totalRevenue,
      teamCompletionRate,
      topPerformers,
      payrollSummary,
      keyInsights
    }
  }

  /**
   * Generate individual staff profiles (Section 2)
   */
  private async generateStaffProfiles(period: ReportPeriod): Promise<StaffProfile[]> {
    const { data: staff } = await this.supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)

    if (!staff) return []

    const profiles = await Promise.all(
      staff.map(s => this.generateIndividualProfile(s, period))
    )

    return profiles
  }

  /**
   * Generate team comparison analysis (Section 3)
   */
  private async generateTeamComparison(period: ReportPeriod): Promise<TeamComparison> {
    const staffProfiles = await this.generateStaffProfiles(period)

    // Performance matrix
    const performanceMatrix: TeamMemberRow[] = staffProfiles.map(profile => ({
      staffId: profile.staffId,
      staffName: profile.staffName,
      revenue: profile.metrics.revenueGenerated,
      appointments: profile.metrics.appointments,
      revenuePerAppt: profile.metrics.avgRevenuePerAppt,
      revenuePerHour: profile.metrics.revenuePerHour,
      retention: profile.metrics.customerRetention,
      tier: profile.performanceTier,
      netPay: profile.payrollBreakdown.netPay
    }))

    // Calculate distributions
    const totalRevenue = performanceMatrix.reduce((sum, m) => sum + m.revenue, 0)
    const totalAppointments = performanceMatrix.reduce((sum, m) => sum + m.appointments, 0)
    const totalPayroll = performanceMatrix.reduce((sum, m) => sum + m.netPay, 0)

    const distributions = {
      revenue: performanceMatrix.map(m => ({
        label: m.staffName,
        value: m.revenue,
        percent: totalRevenue > 0 ? (m.revenue / totalRevenue) * 100 : 0
      })),
      tiers: this.calculateTierDistribution(performanceMatrix),
      workload: performanceMatrix.map(m => ({
        staffName: m.staffName,
        appointments: m.appointments,
        percent: totalAppointments > 0 ? (m.appointments / totalAppointments) * 100 : 0
      })),
      payroll: performanceMatrix.map(m => ({
        staffName: m.staffName,
        amount: m.netPay,
        percent: totalPayroll > 0 ? (m.netPay / totalPayroll) * 100 : 0
      }))
    }

    // Quadrant analysis
    const avgRevenue = totalRevenue / performanceMatrix.length
    const avgRetention = performanceMatrix.reduce((sum, m) => sum + m.retention, 0) / performanceMatrix.length

    const quadrantAnalysis = {
      starPerformers: performanceMatrix
        .filter(m => m.revenue >= avgRevenue && m.retention >= avgRetention)
        .map(m => m.staffName),
      revenueDrivers: performanceMatrix
        .filter(m => m.revenue >= avgRevenue && m.retention < avgRetention)
        .map(m => m.staffName),
      loyalNeedGrowth: performanceMatrix
        .filter(m => m.revenue < avgRevenue && m.retention >= avgRetention)
        .map(m => m.staffName),
      needsImprovement: performanceMatrix
        .filter(m => m.revenue < avgRevenue && m.retention < avgRetention)
        .map(m => m.staffName)
    }

    return {
      performanceMatrix,
      distributions,
      quadrantAnalysis
    }
  }

  /**
   * Generate insights and recommendations (Section 4)
   */
  private async generateInsightsRecommendations(period: ReportPeriod): Promise<InsightsRecommendations> {
    const staffProfiles = await this.generateStaffProfiles(period)
    const teamComparison = await this.generateTeamComparison(period)

    // Strategic insights
    const avgRetention = staffProfiles.reduce((sum, p) => sum + p.metrics.customerRetention, 0) / staffProfiles.length
    const totalRevenue = staffProfiles.reduce((sum, p) => sum + p.metrics.revenueGenerated, 0)
    const topTierCount = staffProfiles.filter(p => p.performanceTier === 'Gold' || p.performanceTier === 'Platinum').length

    const teamStrengths = []
    const areasForImprovement = []

    if (avgRetention >= 70) {
      teamStrengths.push(`Strong customer retention overall (${avgRetention.toFixed(1)}% average)`)
    }
    if (topTierCount >= staffProfiles.length / 2) {
      teamStrengths.push(`${topTierCount} staff in top performance tier`)
    }

    const lowUtilizationStaff = staffProfiles.filter(p => p.operationalStats.utilizationRate < 60)
    if (lowUtilizationStaff.length > 0) {
      areasForImprovement.push(`${lowUtilizationStaff.length} staff below minimum utilization (60%)`)
    }

    // Actionable recommendations
    const immediate: RecommendationItem[] = []
    const strategic: RecommendationItem[] = []

    const lowProductSales = staffProfiles.filter(p => p.productPerformance.conversionRate < 20)
    if (lowProductSales.length > 0) {
      immediate.push({
        title: 'Provide Product Training',
        description: 'Below average in product sales',
        staffAffected: lowProductSales.map(p => p.staffName)
      })
    }

    strategic.push({
      title: 'Implement mentorship program',
      description: 'Pair top performers with developing staff'
    })

    // Staffing recommendations
    const totalCapacity = staffProfiles.reduce((sum, p) => sum + (p.operationalStats.totalHours * 60 / 30), 0) // rough estimate
    const totalBooked = staffProfiles.reduce((sum, p) => sum + p.operationalStats.totalAppointments, 0)
    const currentUtilization = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0

    const recommendations = []
    if (currentUtilization > 85) {
      recommendations.push('Consider hiring additional staff')
    } else if (currentUtilization < 60) {
      recommendations.push('Optimize scheduling to increase utilization')
    }

    return {
      strategicInsights: {
        teamStrengths,
        areasForImprovement
      },
      actionableRecommendations: {
        immediate,
        strategic
      },
      staffingRecommendations: {
        totalCapacity,
        currentUtilization,
        peakStress: 'Wednesday 2-5 PM',
        recommendations
      }
    }
  }

  /**
   * Helper: Generate individual staff profile
   */
  private async generateIndividualProfile(staff: any, period: ReportPeriod): Promise<StaffProfile> {
    // Get appointments for this staff in period
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select(`
        *,
        appointment_services (
          service_id,
          price,
          quantity,
          services (
            name,
            duration,
            category_id,
            service_categories (
              name
            )
          )
        ),
        appointment_products (
          product_id,
          quantity,
          products (
            name,
            price
          )
        )
      `)
      .eq('staff_id', staff.id)
      .gte('appointment_date', period.startDate)
      .lte('appointment_date', period.endDate)

    const completedAppointments = appointments?.filter(a => a.status === 'completed') || []
    const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.total_price || 0), 0)
    const completionRate = appointments?.length ? (completedAppointments.length / appointments.length) * 100 : 0

    // Calculate product sales
    const productRevenue = completedAppointments.reduce((sum, appt) => {
      const products = appt.appointment_products || []
      return sum + products.reduce((pSum: number, p: any) => pSum + (p.products.price * p.quantity), 0)
    }, 0)

    // Get payroll data
    const payrollPeriod: PayrollPeriod = { month: period.month, year: period.year }
    const payrollData = await this.payrollEngine.calculateStaffPayroll(staff.id, payrollPeriod)

    // Build profile
    const profile: StaffProfile = {
      staffId: staff.id,
      staffName: staff.full_name || staff.name || 'Unknown',
      position: staff.position || 'Stylist',
      joinedDate: staff.created_at,
      performanceTier: payrollData?.performanceTier?.name || 'Bronze',

      performanceScore: this.calculatePerformanceScore(totalRevenue, appointments?.length || 0, completionRate),
      scoreBreakdown: {
        revenue: totalRevenue > 10000 ? 100 : (totalRevenue / 10000) * 100,
        appointments: appointments?.length || 0 > 100 ? 100 : ((appointments?.length || 0) / 100) * 100,
        completion: completionRate,
        retention: 75, // Calculate from customer data
        efficiency: totalRevenue > 0 ? Math.min(100, (totalRevenue / ((appointments?.length || 1) * 100))) : 0
      },

      metrics: {
        revenueGenerated: totalRevenue,
        revenueTrend: 15, // Need previous period data
        appointments: appointments?.length || 0,
        appointmentsTrend: 10,
        completionRate,
        completionTrend: 0,
        customerRetention: 75,
        retentionTrend: 5,
        avgRevenuePerAppt: appointments?.length ? totalRevenue / appointments.length : 0,
        avgRevenuePerApptTrend: 8,
        revenuePerHour: payrollData?.totalHours ? totalRevenue / payrollData.totalHours : 0,
        revenuePerHourTrend: 12
      },

      performanceTrend: [], // Need historical data

      operationalStats: {
        totalHours: payrollData?.totalHours || 0,
        totalAppointments: appointments?.length || 0,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: appointments?.filter(a => a.status === 'cancelled').length || 0,
        avgAppointmentsPerDay: appointments?.length ? (appointments.length / 30) : 0,
        peakDay: 'Wednesday',
        peakDayCount: 0,
        utilizationRate: 75 // Calculate based on available hours
      },

      servicePerformance: this.calculateServicePerformance(completedAppointments),

      productPerformance: {
        productsSold: completedAppointments.reduce((sum, a) => sum + (a.appointment_products?.length || 0), 0),
        productRevenue,
        productCommission: productRevenue * 0.10,
        conversionRate: appointments?.length ? (completedAppointments.filter(a => a.appointment_products?.length > 0).length / appointments.length) * 100 : 0,
        topProduct: 'Hair Product',
        topProductCount: 0
      },

      customerInsights: {
        totalCustomers: completedAppointments.length, // Simplified
        newCustomers: Math.floor(completedAppointments.length * 0.3),
        newCustomersPercent: 30,
        returningCustomers: Math.floor(completedAppointments.length * 0.7),
        returningCustomersPercent: 70,
        repeatRate: 70,
        loyaltyScore: 8,
        avgLifetimeValue: totalRevenue / Math.max(1, completedAppointments.length)
      },

      payrollBreakdown: {
        baseSalary: payrollData?.calculations.basePay || 0,
        serviceCommissions: [],
        totalServiceCommissions: payrollData?.calculations.baseCommission || 0,
        productCommissions: productRevenue * 0.10,
        productCommissionRate: 10,
        performanceBonuses: [],
        totalPerformanceBonuses: payrollData?.bonuses.retention || 0,
        individualBonuses: [],
        totalIndividualBonuses: payrollData?.bonuses.individual || 0,
        teamBonuses: [],
        totalTeamBonuses: payrollData?.bonuses.team || 0,
        grossPay: payrollData?.calculations.grossPay || 0,
        deductions: [],
        totalDeductions: payrollData?.calculations.deductions || 0,
        adjustments: [],
        totalAdjustments: 0,
        netPay: payrollData?.calculations.netPay || 0
      },

      rankings: {
        revenueRank: 1,
        revenuePercentile: 90,
        appointmentsRank: 1,
        appointmentsPercentile: 85,
        efficiencyRank: 1,
        efficiencyPercentile: 88,
        retentionRank: 1,
        retentionPercentile: 92
      },

      comparison: [],

      tierStatus: {
        currentTier: payrollData?.performanceTier?.name || 'Bronze',
        nextTier: 'Silver',
        progressPercent: 80,
        revenueNeeded: 2000,
        estimatedMonths: 2
      },

      strengths: [
        {
          title: 'High Customer Retention',
          description: '75% customers return (Team avg: 70%)',
          value: '75%'
        }
      ],

      improvements: [
        {
          title: 'Increase Product Sales',
          description: `Currently $${productRevenue.toFixed(0)} vs team avg $5,000`,
          action: 'Recommend product training program'
        }
      ],

      bookingPatterns: {
        busiestDay: 'Wednesday',
        busiestDayAvg: 8,
        quietestDay: 'Monday',
        quietestDayAvg: 3,
        peakHours: '2 PM - 5 PM',
        serviceBreakdown: {}
      },

      customerDemographics: {
        newVsReturning: { new: 30, returning: 70 },
        walkInsVsBooked: { walkIn: 10, booked: 90 },
        mostLoyalCustomer: 'Customer Name',
        mostLoyalCustomerVisits: 10
      },

      weeklyTrend: [],

      goals: [
        {
          category: 'Revenue Target',
          target: `$${(totalRevenue * 1.1).toFixed(0)}`,
          increase: '+10%'
        }
      ],

      actionItems: [
        { task: 'Complete product training module', completed: false },
        { task: 'Implement upsell techniques', completed: false }
      ],

      managerNotes: ''
    }

    return profile
  }

  /**
   * Helper: Calculate payroll for all staff
   */
  private async calculatePayrollForAllStaff(staff: any[], period: PayrollPeriod): Promise<any[]> {
    const payrollData = []

    for (const s of staff) {
      try {
        const staffPayroll = await this.payrollEngine.calculateStaffPayroll(s.id, period)
        payrollData.push(staffPayroll)
      } catch (error) {
        console.error(`Error calculating payroll for staff ${s.id}:`, error)
        // Continue with other staff even if one fails
      }
    }

    return payrollData
  }

  /**
   * Helper methods
   */
  private async identifyTopPerformers(period: ReportPeriod, appointments: any[]): Promise<TopPerformer[]> {
    // Group by staff
    const staffStats = new Map<string, { name: string; revenue: number; appointments: number }>()

    for (const appt of appointments) {
      if (appt.staff_id && appt.status === 'completed') {
        const existing = staffStats.get(appt.staff_id) || { name: '', revenue: 0, appointments: 0 }
        existing.revenue += appt.total_price || 0
        existing.appointments += 1
        staffStats.set(appt.staff_id, existing)
      }
    }

    // Get staff names
    const staffIds = Array.from(staffStats.keys())
    const { data: staff } = await this.supabase
      .from('staff')
      .select('id, full_name')
      .in('id', staffIds)

    staff?.forEach(s => {
      const stats = staffStats.get(s.id)
      if (stats) stats.name = s.full_name
    })

    // Find top performers
    const topPerformers: TopPerformer[] = []

    // Highest revenue
    const byRevenue = Array.from(staffStats.entries()).sort((a, b) => b[1].revenue - a[1].revenue)
    if (byRevenue[0]) {
      topPerformers.push({
        type: 'revenue',
        staffId: byRevenue[0][0],
        staffName: byRevenue[0][1].name,
        value: byRevenue[0][1].revenue,
        displayValue: `$${byRevenue[0][1].revenue.toFixed(0)}`
      })
    }

    // Most appointments
    const byAppts = Array.from(staffStats.entries()).sort((a, b) => b[1].appointments - a[1].appointments)
    if (byAppts[0]) {
      topPerformers.push({
        type: 'appointments',
        staffId: byAppts[0][0],
        staffName: byAppts[0][1].name,
        value: byAppts[0][1].appointments,
        displayValue: `${byAppts[0][1].appointments} bookings`
      })
    }

    return topPerformers
  }

  private async generatePayrollSummary(payrollData: any[]): Promise<PayrollSummaryRow[]> {
    return payrollData.map(p => ({
      staffId: p.staffId,
      staffName: p.staffName,
      basePay: p.calculations.basePay,
      commissions: p.calculations.baseCommission,
      bonuses: p.calculations.totalBonuses,
      deductions: p.calculations.deductions,
      netPay: p.calculations.netPay,
      status: 'approved' as const
    }))
  }

  private async generateKeyInsights(period: ReportPeriod, appointments: any[], payrollData: any[]): Promise<KeyInsight[]> {
    const insights: KeyInsight[] = []

    // Check for low completion rates
    const staffWithLowCompletion = payrollData.filter(p =>
      p.appointments.total > 0 && (p.appointments.completed / p.appointments.total) < 0.85
    )

    staffWithLowCompletion.forEach(staff => {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        message: `Low completion rate (${((staff.appointments.completed / staff.appointments.total) * 100).toFixed(0)}%)`,
        staffId: staff.staffId,
        staffName: staff.staffName
      })
    })

    return insights
  }

  private calculateTierDistribution(matrix: TeamMemberRow[]): TierDistribution[] {
    const tierCounts = new Map<string, number>()
    matrix.forEach(m => {
      tierCounts.set(m.tier, (tierCounts.get(m.tier) || 0) + 1)
    })

    return Array.from(tierCounts.entries()).map(([tier, count]) => ({
      tier,
      count,
      percent: (count / matrix.length) * 100
    }))
  }

  private calculatePerformanceScore(revenue: number, appointments: number, completionRate: number): number {
    const revenueScore = Math.min(40, (revenue / 10000) * 40)
    const apptScore = Math.min(30, (appointments / 100) * 30)
    const completionScore = (completionRate / 100) * 30
    return Math.round(revenueScore + apptScore + completionScore)
  }

  private calculateServicePerformance(appointments: any[]): ServiceStats[] {
    const categoryStats = new Map<string, { bookings: number; revenue: number }>()

    appointments.forEach(appt => {
      appt.appointment_services?.forEach((as: any) => {
        const category = as.services?.service_categories?.name || 'Other'
        const existing = categoryStats.get(category) || { bookings: 0, revenue: 0 }
        existing.bookings += as.quantity || 1
        existing.revenue += as.price * (as.quantity || 1)
        categoryStats.set(category, existing)
      })
    })

    const totalRevenue = Array.from(categoryStats.values()).reduce((sum, s) => sum + s.revenue, 0)

    return Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      bookings: stats.bookings,
      revenue: stats.revenue,
      avgPrice: stats.bookings > 0 ? stats.revenue / stats.bookings : 0,
      percentOfTotal: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
    }))
  }
}
