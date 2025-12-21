/**
 * Payroll Calculation Engine
 * Handles all payroll calculations including commissions, bonuses, and tiers
 */

import { createClient } from '@/lib/supabase/server'

export type PayrollPeriod = {
  month: number // 1-12
  year: number
}

export type StaffPayrollData = {
  staffId: string
  staffName: string
  hourlyRate: number
  commissionRate: number
  skillPremiumHourly: number
  totalHours: number
  appointments: {
    total: number
    completed: number
    revenue: number
  }
  productSales: number
  performanceTier: {
    id: string
    name: string
    multiplier: number
    bonus: number
  } | null
  bonuses: {
    individual: number
    team: number
    retention: number
    skill: number
  }
  calculations: {
    basePay: number
    baseCommission: number
    adjustedCommission: number
    totalBonuses: number
    grossPay: number
    deductions: number
    netPay: number
  }
}

export class PayrollEngine {
  private supabase = createClient()
  private settingsCache: Map<string, number> = new Map()

  /**
   * Get a payroll setting value from database (with caching)
   */
  private async getSetting(key: string, defaultValue: number): Promise<number> {
    // Check cache first
    if (this.settingsCache.has(key)) {
      return this.settingsCache.get(key)!
    }

    // Fetch from database
    const { data } = await this.supabase
      .from('payroll_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single()

    const value = data?.setting_value ?? defaultValue
    this.settingsCache.set(key, value)
    return value
  }

  /**
   * Calculate monthly payroll for a specific staff member
   */
  async calculateStaffPayroll(
    staffId: string,
    period: PayrollPeriod
  ): Promise<StaffPayrollData> {
    // 1. Get staff details
    const { data: staff } = await this.supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single()

    if (!staff) {
      throw new Error('Staff member not found')
    }

    // 2. Get completed appointments for the period
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select(`
        *,
        appointment_services(service_id, price, quantity)
      `)
      .eq('staff_id', staffId)
      .eq('status', 'completed')
      .gte('appointment_date', `${period.year}-${String(period.month).padStart(2, '0')}-01`)
      .lt('appointment_date', this.getNextMonthStart(period))

    const appointmentData = appointments || []
    const completedCount = appointmentData.length

    // 3. Calculate total service revenue
    let totalServiceRevenue = 0
    for (const apt of appointmentData) {
      if (apt.appointment_services && apt.appointment_services.length > 0) {
        totalServiceRevenue += apt.appointment_services.reduce(
          (sum: number, svc: any) => sum + (svc.price * (svc.quantity || 1)),
          0
        )
      }
    }

    // 4. Calculate product sales commission
    const { data: productSales } = await this.supabase
      .from('appointment_products')
      .select(`
        quantity,
        products(price)
      `)
      .in('appointment_id', appointmentData.map(a => a.id))

    const totalProductRevenue = (productSales || []).reduce(
      (sum, item: any) => sum + (item.products?.price || 0) * item.quantity,
      0
    )

    // 5. Determine performance tier
    const tier = await this.getPerformanceTier(completedCount)

    // 6. Calculate base commission
    const baseCommissionRate = staff.commission_rate || 0
    const baseCommission = (totalServiceRevenue * baseCommissionRate) / 100

    // 7. Apply tier multiplier to commission
    const tierMultiplier = tier?.multiplier || 1.00
    const adjustedCommission = baseCommission * tierMultiplier

    // 8. Calculate product commission (configurable rate)
    const productCommissionRate = await this.getSetting('product_commission_rate', 10.00)
    const productCommission = (totalProductRevenue * productCommissionRate) / 100

    // 9. Get individual bonuses
    const { data: individualBonuses } = await this.supabase
      .from('staff_bonuses')
      .select('amount')
      .eq('staff_id', staffId)
      .eq('period_month', period.month)
      .eq('period_year', period.year)

    const totalIndividualBonuses = (individualBonuses || []).reduce(
      (sum, b) => sum + Number(b.amount),
      0
    )

    // 10. Calculate retention bonus (repeat customers within 30 days)
    const retentionBonus = await this.calculateRetentionBonus(staffId, period)

    // 11. Get team bonuses share
    const teamBonus = await this.calculateTeamBonusShare(staffId, period)

    // 12. Calculate skill premium
    const skillPremiumHourly = Number(staff.skill_premium_hourly || 0)
    const totalHours = await this.calculateTotalHours(staffId, period)
    const skillPremium = skillPremiumHourly * totalHours

    // 13. Calculate base pay (hourly)
    const hourlyRate = staff.hourly_rate || 0
    const basePay = hourlyRate * totalHours

    // 14. Sum all bonuses
    const totalBonuses =
      (tier?.bonus || 0) +
      totalIndividualBonuses +
      teamBonus +
      retentionBonus +
      skillPremium

    // 15. Calculate totals
    const grossPay = basePay + adjustedCommission + productCommission + totalBonuses
    const deductions = 0 // Can be extended for uniform fees, etc.
    const netPay = grossPay - deductions

    return {
      staffId: staff.id,
      staffName: staff.full_name,
      hourlyRate: hourlyRate,
      commissionRate: baseCommissionRate,
      skillPremiumHourly,
      totalHours,
      appointments: {
        total: completedCount,
        completed: completedCount,
        revenue: totalServiceRevenue
      },
      productSales: totalProductRevenue,
      performanceTier: tier,
      bonuses: {
        individual: totalIndividualBonuses,
        team: teamBonus,
        retention: retentionBonus,
        skill: skillPremium
      },
      calculations: {
        basePay,
        baseCommission: baseCommission + productCommission,
        adjustedCommission: adjustedCommission + productCommission,
        totalBonuses,
        grossPay,
        deductions,
        netPay
      }
    }
  }

  /**
   * Calculate and save payroll for all active staff for a period
   */
  async calculateAllStaffPayroll(period: PayrollPeriod): Promise<void> {
    const { data: allStaff } = await this.supabase
      .from('staff')
      .select('id')
      .eq('is_active', true)

    if (!allStaff) return

    for (const staff of allStaff) {
      const payrollData = await this.calculateStaffPayroll(staff.id, period)
      await this.savePayrollRecord(payrollData, period)
    }
  }

  /**
   * Save calculated payroll to monthly_payroll table
   */
  async savePayrollRecord(
    data: StaffPayrollData,
    period: PayrollPeriod
  ): Promise<void> {
    const payrollRecord = {
      staff_id: data.staffId,
      period_month: period.month,
      period_year: period.year,

      total_hours: data.totalHours,
      hourly_rate: data.hourlyRate,
      base_pay: data.calculations.basePay,

      total_appointments: data.appointments.total,
      completed_appointments: data.appointments.completed,
      total_service_revenue: data.appointments.revenue,
      total_product_sales: data.productSales,
      commission_rate: data.commissionRate,
      base_commission: data.calculations.baseCommission,

      performance_tier_id: data.performanceTier?.id || null,
      tier_multiplier: data.performanceTier?.multiplier || 1.00,
      tier_bonus: data.performanceTier?.bonus || 0,
      adjusted_commission: data.calculations.adjustedCommission,

      individual_bonuses: data.bonuses.individual,
      team_bonuses: data.bonuses.team,
      skill_premium: data.bonuses.skill,
      retention_bonus: data.bonuses.retention,
      total_bonuses: data.calculations.totalBonuses,

      gross_pay: data.calculations.grossPay,
      deductions: data.calculations.deductions,
      net_pay: data.calculations.netPay,

      status: 'calculated',
      calculated_at: new Date().toISOString()
    }

    await this.supabase
      .from('monthly_payroll')
      .upsert(payrollRecord, {
        onConflict: 'staff_id,period_month,period_year'
      })
  }

  /**
   * Get performance tier based on completed appointments
   */
  private async getPerformanceTier(appointmentCount: number) {
    const { data: tiers } = await this.supabase
      .from('performance_tiers')
      .select('*')
      .eq('is_active', true)
      .order('min_appointments', { ascending: false })

    if (!tiers) return null

    for (const tier of tiers) {
      if (
        appointmentCount >= tier.min_appointments &&
        (tier.max_appointments === null || appointmentCount <= tier.max_appointments)
      ) {
        return {
          id: tier.id,
          name: tier.name,
          multiplier: Number(tier.commission_multiplier),
          bonus: Number(tier.monthly_bonus)
        }
      }
    }

    return null
  }

  /**
   * Calculate retention bonus (repeat customers)
   */
  private async calculateRetentionBonus(
    staffId: string,
    period: PayrollPeriod
  ): Promise<number> {
    // Get all completed appointments for this staff in the period
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select('customer_email, appointment_date')
      .eq('staff_id', staffId)
      .eq('status', 'completed')
      .gte('appointment_date', `${period.year}-${String(period.month).padStart(2, '0')}-01`)
      .lt('appointment_date', this.getNextMonthStart(period))
      .order('appointment_date')

    if (!appointments || appointments.length === 0) return 0

    // Count repeat customers (customers with >1 appointment in period)
    const customerCounts = new Map<string, number>()
    for (const apt of appointments) {
      if (apt.customer_email) {
        customerCounts.set(
          apt.customer_email,
          (customerCounts.get(apt.customer_email) || 0) + 1
        )
      }
    }

    const repeatCustomers = Array.from(customerCounts.values()).filter(count => count > 1).length

    // Bonus: Configurable amounts per repeat customer
    const bonusPerRepeat = await this.getSetting('retention_bonus_per_repeat', 50.00)
    const bonusThreshold = await this.getSetting('retention_bonus_threshold', 3.00)
    const bonusExtra = await this.getSetting('retention_bonus_extra', 200.00)

    let bonus = repeatCustomers * bonusPerRepeat
    if (repeatCustomers >= bonusThreshold) {
      bonus += bonusExtra
    }

    return bonus
  }

  /**
   * Calculate team bonus share for staff member
   */
  private async calculateTeamBonusShare(
    staffId: string,
    period: PayrollPeriod
  ): Promise<number> {
    // Get achieved team bonuses for the period
    const { data: teamBonuses } = await this.supabase
      .from('team_bonuses')
      .select('*')
      .eq('is_achieved', true)
      .gte('period_start', `${period.year}-${String(period.month).padStart(2, '0')}-01`)
      .lt('period_end', this.getNextMonthStart(period))

    if (!teamBonuses || teamBonuses.length === 0) return 0

    let totalShare = 0

    for (const bonus of teamBonuses) {
      if (bonus.distribution_method === 'equal') {
        // Equal split among all active staff
        const { count } = await this.supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        if (count) {
          totalShare += Number(bonus.bonus_amount) / count
        }
      } else if (bonus.distribution_method === 'proportional') {
        // TODO: Implement proportional distribution based on hours/revenue
        // For now, use equal distribution
        const { count } = await this.supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        if (count) {
          totalShare += Number(bonus.bonus_amount) / count
        }
      }
    }

    return totalShare
  }

  /**
   * Calculate total hours worked (estimated from completed appointments)
   * Since we don't have attendance, we estimate based on service durations
   */
  private async calculateTotalHours(
    staffId: string,
    period: PayrollPeriod
  ): Promise<number> {
    const { data: appointments } = await this.supabase
      .from('appointments')
      .select(`
        *,
        appointment_services(
          service_id,
          services(duration)
        )
      `)
      .eq('staff_id', staffId)
      .eq('status', 'completed')
      .gte('appointment_date', `${period.year}-${String(period.month).padStart(2, '0')}-01`)
      .lt('appointment_date', this.getNextMonthStart(period))

    if (!appointments) return 0

    // Sum service durations and convert to hours
    let totalMinutes = 0
    for (const apt of appointments) {
      if (apt.appointment_services) {
        for (const svc of apt.appointment_services) {
          totalMinutes += svc.services?.duration || 0
        }
      }
    }

    // Add buffer time (configurable minutes per appointment for setup/cleanup)
    const bufferMinutes = await this.getSetting('buffer_time_minutes', 15.00)
    totalMinutes += appointments.length * bufferMinutes

    return Math.round((totalMinutes / 60) * 100) / 100 // Round to 2 decimals
  }

  /**
   * Get start of next month
   */
  private getNextMonthStart(period: PayrollPeriod): string {
    const nextMonth = period.month === 12 ? 1 : period.month + 1
    const nextYear = period.month === 12 ? period.year + 1 : period.year
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  }

  /**
   * Approve a payroll record
   */
  async approvePayroll(payrollId: string, approvedBy: string): Promise<void> {
    await this.supabase
      .from('monthly_payroll')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy
      })
      .eq('id', payrollId)
  }

  /**
   * Mark payroll as paid
   */
  async markAsPaid(payrollId: string): Promise<void> {
    await this.supabase
      .from('monthly_payroll')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', payrollId)
  }

  /**
   * Get payroll summary for a period
   */
  async getPayrollSummary(period: PayrollPeriod) {
    const { data: payrolls } = await this.supabase
      .from('monthly_payroll')
      .select(`
        *,
        staff(full_name, email),
        performance_tier:performance_tiers(name)
      `)
      .eq('period_month', period.month)
      .eq('period_year', period.year)
      .order('net_pay', { ascending: false })

    const summary = {
      totalStaff: payrolls?.length || 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalCommissions: 0,
      totalBonuses: 0,
      totalHours: 0,
      payrolls: payrolls || []
    }

    if (payrolls) {
      for (const p of payrolls) {
        summary.totalGrossPay += Number(p.gross_pay)
        summary.totalNetPay += Number(p.net_pay)
        summary.totalCommissions += Number(p.adjusted_commission)
        summary.totalBonuses += Number(p.total_bonuses)
        summary.totalHours += Number(p.total_hours)
      }
    }

    return summary
  }
}
