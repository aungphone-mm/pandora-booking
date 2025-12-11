/**
 * Analytics-related type definitions
 * Used for reporting and analytics features
 */

export interface CustomerSegment {
  email: string
  totalBookings: number
  totalSpent: number
  avgBookingGap: number
  estimatedLTV: number
  isRegistered: boolean
  lastBooking?: string
}

export interface ServicePerformance {
  id: string
  name: string
  bookings: number
  revenue: number
  avgDuration: number
  revenuePerHour: number
}

export interface StaffPerformance {
  id: string
  name: string
  totalAppointments: number
  revenue: number
  avgRating?: number
}

export interface WeeklyTrend {
  week: string
  revenue: number
  bookings: number
  avgBookingValue: number
}

export interface ReportData {
  totalRevenue: number
  totalAppointments: number
  avgBookingValue: number
  servicePerformance: ServicePerformance[]
  staffPerformance: StaffPerformance[]
  weeklyTrends?: WeeklyTrend[]
  customerSegments?: CustomerSegment[]
}

export interface CSVExportData {
  headers: string[]
  data: any[][]
  filename: string
}
