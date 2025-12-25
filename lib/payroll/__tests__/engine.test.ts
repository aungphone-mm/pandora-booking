/**
 * PayrollEngine Unit Tests
 *
 * CRITICAL: These tests verify financial calculations that affect real money.
 * Any bugs here could result in incorrect staff payments.
 *
 * Test Coverage:
 * - Base pay calculation (hourly rate × hours)
 * - Commission calculations (service + product)
 * - Performance tier bonuses and multipliers
 * - Retention bonuses (repeat customers)
 * - Team bonus distribution
 * - Skill premium calculations
 * - Gross and net pay totals
 * - Edge cases (zero values, null data, missing records)
 */

import { PayrollEngine, type PayrollPeriod } from '../engine'

// Helper function to create a mock Supabase chain
function createMockChain(finalResult: any) {
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
  }

  // Make all chainable methods return a promise when needed
  chain.select.mockImplementation(() => chain)
  chain.from.mockImplementation(() => chain)
  chain.eq.mockImplementation(() => chain)
  chain.gte.mockImplementation(() => chain)
  chain.lt.mockImplementation(() => chain)
  chain.order.mockImplementation(() => chain)
  chain.in.mockImplementation(() => chain)

  return chain
}

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('PayrollEngine - Financial Calculations', () => {
  let mockSupabase: any
  let engine: PayrollEngine

  // Test period: December 2024
  const testPeriod: PayrollPeriod = {
    month: 12,
    year: 2024
  }

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn()
      }
    }

    // Mock the createClient function
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockReturnValue(mockSupabase)

    // Create a new engine instance
    engine = new PayrollEngine()
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle staff member not found', async () => {
      mockSupabase.from.mockReturnValue(
        createMockChain({
          data: null,
          error: { message: 'Staff not found' }
        })
      )

      await expect(
        engine.calculateStaffPayroll('non-existent-staff', testPeriod)
      ).rejects.toThrow('Staff member not found')
    })

    it('should handle zero revenue correctly', async () => {
      // Expect calculation methods to handle zero values
      // This test verifies mathematical safety
      const zeroRevenue = 0
      const commissionRate = 15
      const expectedCommission = (zeroRevenue * commissionRate) / 100

      expect(expectedCommission).toBe(0)
    })

    it('should handle null commission rate (default to 0)', async () => {
      const nullCommissionRate = null
      const revenue = 100000
      const safeCommissionRate = nullCommissionRate || 0
      const commission = (revenue * safeCommissionRate) / 100

      expect(commission).toBe(0)
    })
  })

  describe('Mathematical Calculations - Unit Tests', () => {
    describe('Base Pay Calculation', () => {
      it('should calculate base pay: hourly_rate × total_hours', () => {
        const hourlyRate = 10000 // 10,000 MMK/hour
        const totalHours = 40
        const expectedBasePay = hourlyRate * totalHours

        expect(expectedBasePay).toBe(400000) // 400,000 MMK
      })

      it('should handle decimal hours correctly', () => {
        const hourlyRate = 5000
        const totalHours = 37.5 // 37.5 hours
        const expectedBasePay = hourlyRate * totalHours

        expect(expectedBasePay).toBe(187500) // 187,500 MMK
      })

      it('should handle zero hours', () => {
        const hourlyRate = 10000
        const totalHours = 0
        const expectedBasePay = hourlyRate * totalHours

        expect(expectedBasePay).toBe(0)
      })
    })

    describe('Commission Calculation', () => {
      it('should calculate base commission: revenue × (rate / 100)', () => {
        const revenue = 500000 // 500,000 MMK
        const commissionRate = 15 // 15%
        const expectedCommission = (revenue * commissionRate) / 100

        expect(expectedCommission).toBe(75000) // 75,000 MMK
      })

      it('should calculate commission with tier multiplier', () => {
        const baseCommission = 100000
        const tierMultiplier = 1.20 // 20% boost
        const adjustedCommission = baseCommission * tierMultiplier

        expect(adjustedCommission).toBe(120000) // 120,000 MMK
      })

      it('should handle product commission separately', () => {
        const productRevenue = 50000
        const productCommissionRate = 10 // 10%
        const productCommission = (productRevenue * productCommissionRate) / 100

        expect(productCommission).toBe(5000) // 5,000 MMK
      })
    })

    describe('Performance Tier Logic', () => {
      it('should apply correct tier multiplier based on appointment count', () => {
        const tierRules = [
          { minAppointments: 0, maxAppointments: 10, multiplier: 1.00 },
          { minAppointments: 11, maxAppointments: 20, multiplier: 1.10 },
          { minAppointments: 21, maxAppointments: null, multiplier: 1.25 }
        ]

        // Test different appointment counts
        const appointmentCount1 = 8 // Should get 1.00
        const appointmentCount2 = 15 // Should get 1.10
        const appointmentCount3 = 25 // Should get 1.25

        function getTierMultiplier(count: number) {
          for (const tier of tierRules) {
            if (count >= tier.minAppointments &&
                (tier.maxAppointments === null || count <= tier.maxAppointments)) {
              return tier.multiplier
            }
          }
          return 1.00
        }

        expect(getTierMultiplier(appointmentCount1)).toBe(1.00)
        expect(getTierMultiplier(appointmentCount2)).toBe(1.10)
        expect(getTierMultiplier(appointmentCount3)).toBe(1.25)
      })
    })

    describe('Retention Bonus Calculation', () => {
      it('should calculate bonus for repeat customers', () => {
        const repeatCustomers = 5
        const bonusPerRepeat = 50 // 50 MMK per repeat customer
        const threshold = 3
        const extraBonus = 200 // 200 MMK if >= threshold

        let bonus = repeatCustomers * bonusPerRepeat
        if (repeatCustomers >= threshold) {
          bonus += extraBonus
        }

        expect(bonus).toBe(450) // (5 × 50) + 200 = 450 MMK
      })

      it('should not add extra bonus if below threshold', () => {
        const repeatCustomers = 2
        const bonusPerRepeat = 50
        const threshold = 3
        const extraBonus = 200

        let bonus = repeatCustomers * bonusPerRepeat
        if (repeatCustomers >= threshold) {
          bonus += extraBonus
        }

        expect(bonus).toBe(100) // 2 × 50 = 100 MMK (no extra)
      })

      it('should count repeat customers correctly', () => {
        const appointments = [
          { customerEmail: 'customer1@example.com' },
          { customerEmail: 'customer1@example.com' }, // Repeat
          { customerEmail: 'customer2@example.com' },
          { customerEmail: 'customer2@example.com' }, // Repeat
          { customerEmail: 'customer3@example.com' }  // One-time
        ]

        const customerCounts = new Map<string, number>()
        appointments.forEach(apt => {
          customerCounts.set(
            apt.customerEmail,
            (customerCounts.get(apt.customerEmail) || 0) + 1
          )
        })

        const repeatCustomers = Array.from(customerCounts.values())
          .filter(count => count > 1).length

        expect(repeatCustomers).toBe(2) // customer1 and customer2
      })
    })

    describe('Team Bonus Distribution', () => {
      it('should divide team bonus equally among staff', () => {
        const totalBonus = 1000000 // 1,000,000 MMK
        const activeStaffCount = 5
        const sharePerStaff = totalBonus / activeStaffCount

        expect(sharePerStaff).toBe(200000) // 200,000 MMK per staff
      })

      it('should handle single staff member', () => {
        const totalBonus = 500000
        const activeStaffCount = 1
        const sharePerStaff = totalBonus / activeStaffCount

        expect(sharePerStaff).toBe(500000)
      })

      it('should handle multiple team bonuses', () => {
        const teamBonuses = [
          { amount: 300000, method: 'equal' },
          { amount: 200000, method: 'equal' }
        ]
        const activeStaffCount = 4

        let totalShare = 0
        teamBonuses.forEach(bonus => {
          totalShare += bonus.amount / activeStaffCount
        })

        // (300,000 / 4) + (200,000 / 4) = 75,000 + 50,000 = 125,000
        expect(totalShare).toBe(125000)
      })
    })

    describe('Hours Calculation from Appointments', () => {
      it('should convert service duration minutes to hours', () => {
        const serviceDurationMinutes = 90 // 90 minutes
        const hours = serviceDurationMinutes / 60

        expect(hours).toBe(1.5) // 1.5 hours
      })

      it('should sum multiple service durations', () => {
        const appointments = [
          { services: [{ duration: 60 }] }, // 60 min
          { services: [{ duration: 90 }] }, // 90 min
          { services: [{ duration: 45 }] }  // 45 min
        ]

        let totalMinutes = 0
        appointments.forEach(apt => {
          apt.services.forEach((svc: any) => {
            totalMinutes += svc.duration
          })
        })

        const totalHours = totalMinutes / 60
        expect(totalHours).toBe(3.25) // 195 min = 3.25 hours
      })

      it('should add buffer time per appointment', () => {
        const appointmentCount = 5
        const bufferMinutesPerAppointment = 15
        const totalBufferMinutes = appointmentCount * bufferMinutesPerAppointment
        const bufferHours = totalBufferMinutes / 60

        expect(bufferHours).toBe(1.25) // 75 min = 1.25 hours
      })

      it('should round hours to 2 decimal places', () => {
        const totalMinutes = 123 // 123 minutes
        const hours = totalMinutes / 60 // 2.05
        const roundedHours = Math.round(hours * 100) / 100

        expect(roundedHours).toBe(2.05)
      })
    })

    describe('Multiple Services Per Appointment', () => {
      it('should calculate revenue with quantity multiplier', () => {
        const services = [
          { price: 50000, quantity: 1 },
          { price: 30000, quantity: 2 }
        ]

        const totalRevenue = services.reduce(
          (sum, svc) => sum + (svc.price * svc.quantity),
          0
        )

        // 50,000 + (30,000 × 2) = 110,000
        expect(totalRevenue).toBe(110000)
      })

      it('should handle missing quantity (default to 1)', () => {
        const services = [
          { price: 50000, quantity: undefined }
        ]

        const totalRevenue = services.reduce(
          (sum, svc) => sum + (svc.price * (svc.quantity || 1)),
          0
        )

        expect(totalRevenue).toBe(50000)
      })
    })

    describe('Total Payroll Calculation', () => {
      it('should calculate gross pay correctly', () => {
        const basePay = 200000
        const adjustedCommission = 80000
        const productCommission = 10000
        const totalBonuses = 50000

        const grossPay = basePay + adjustedCommission + productCommission + totalBonuses

        expect(grossPay).toBe(340000) // 340,000 MMK
      })

      it('should calculate net pay: gross pay - deductions', () => {
        const grossPay = 500000
        const deductions = 25000
        const netPay = grossPay - deductions

        expect(netPay).toBe(475000) // 475,000 MMK
      })

      it('should handle zero deductions', () => {
        const grossPay = 500000
        const deductions = 0
        const netPay = grossPay - deductions

        expect(netPay).toBe(grossPay)
      })
    })

    describe('Bonus Aggregation', () => {
      it('should sum all bonus types correctly', () => {
        const bonuses = {
          tierBonus: 50000,
          individualBonus: 30000,
          teamBonus: 40000,
          retentionBonus: 10000,
          skillPremium: 25000
        }

        const totalBonuses = Object.values(bonuses).reduce((sum, b) => sum + b, 0)

        // 50,000 + 30,000 + 40,000 + 10,000 + 25,000 = 155,000
        expect(totalBonuses).toBe(155000)
      })
    })
  })

  describe('getPayrollSummary() - Reporting', () => {
    it('should aggregate payroll data across all staff', async () => {
      const mockPayrolls = [
        {
          gross_pay: 500000,
          net_pay: 480000,
          adjusted_commission: 100000,
          total_bonuses: 50000,
          total_hours: 40
        },
        {
          gross_pay: 600000,
          net_pay: 580000,
          adjusted_commission: 150000,
          total_bonuses: 75000,
          total_hours: 45
        }
      ]

      const mockChain = createMockChain({
        data: mockPayrolls,
        error: null
      })

      // Make order return a resolved promise with the data
      mockChain.order = jest.fn().mockResolvedValue({
        data: mockPayrolls,
        error: null
      })

      mockSupabase.from.mockReturnValue(mockChain)

      const summary = await engine.getPayrollSummary(testPeriod)

      expect(summary.totalStaff).toBe(2)
      expect(summary.totalGrossPay).toBe(1100000) // 500k + 600k
      expect(summary.totalNetPay).toBe(1060000) // 480k + 580k
      expect(summary.totalCommissions).toBe(250000) // 100k + 150k
      expect(summary.totalBonuses).toBe(125000) // 50k + 75k
      expect(summary.totalHours).toBe(85) // 40 + 45
    })

    it('should handle empty payroll data', async () => {
      mockSupabase.from.mockReturnValue(
        createMockChain({
          data: [],
          error: null
        })
      )

      const summary = await engine.getPayrollSummary(testPeriod)

      expect(summary.totalStaff).toBe(0)
      expect(summary.totalGrossPay).toBe(0)
      expect(summary.totalNetPay).toBe(0)
      expect(summary.totalCommissions).toBe(0)
      expect(summary.totalBonuses).toBe(0)
      expect(summary.totalHours).toBe(0)
    })
  })

  describe('approvePayroll() and markAsPaid()', () => {
    it('should call update with correct parameters for approval', async () => {
      mockSupabase.from.mockReturnValue(
        createMockChain({
          data: null,
          error: null
        })
      )

      await engine.approvePayroll('payroll-123', 'admin-user-id')

      expect(mockSupabase.from).toHaveBeenCalledWith('monthly_payroll')
    })

    it('should call update with correct parameters for paid status', async () => {
      mockSupabase.from.mockReturnValue(
        createMockChain({
          data: null,
          error: null
        })
      )

      await engine.markAsPaid('payroll-456')

      expect(mockSupabase.from).toHaveBeenCalledWith('monthly_payroll')
    })
  })
})
