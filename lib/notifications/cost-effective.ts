// Cost-Effective Notification System
import { createClient } from '@/lib/supabase/client'

type NotificationChannel = 'sms' | 'email' | 'push' | 'whatsapp' | 'in-app'
type NotificationPriority = 'high' | 'medium' | 'low'

interface NotificationPreference {
  userId: string
  sms: boolean
  email: boolean
  push: boolean
  whatsapp: boolean
  marketing: boolean // opt-in for promotional messages
}

interface NotificationCost {
  channel: NotificationChannel
  costPerMessage: number
  reliability: number
  deliverySpeed: string
}

const NOTIFICATION_COSTS: NotificationCost[] = [
  { channel: 'sms', costPerMessage: 0.07, reliability: 95, deliverySpeed: 'instant' },
  { channel: 'email', costPerMessage: 0.001, reliability: 85, deliverySpeed: '1-5min' },
  { channel: 'push', costPerMessage: 0.0001, reliability: 70, deliverySpeed: 'instant' },
  { channel: 'whatsapp', costPerMessage: 0.03, reliability: 90, deliverySpeed: 'instant' },
  { channel: 'in-app', costPerMessage: 0, reliability: 60, deliverySpeed: 'when-online' }
]

// Smart notification routing based on cost and priority
export class CostEffectiveNotifications {
  
  // Route notifications based on priority and user preferences
  static async sendNotification(
    message: string,
    userId: string,
    priority: NotificationPriority,
    type: 'booking' | 'reminder' | 'marketing' | 'loyalty'
  ) {
    const userPrefs = await this.getUserPreferences(userId)
    const channels = this.selectOptimalChannels(priority, type, userPrefs)
    
    for (const channel of channels) {
      try {
        await this.sendViaChannel(channel, message, userId)
        break // Stop after first successful delivery
      } catch (error) {
        console.warn(`${channel} delivery failed, trying next channel`)
        continue
      }
    }
  }

  // Smart channel selection logic
  private static selectOptimalChannels(
    priority: NotificationPriority,
    type: string,
    userPrefs: NotificationPreference
  ): NotificationChannel[] {
    
    switch (priority) {
      case 'high': // Booking confirmations, cancellations
        return [
          ...(userPrefs.sms ? ['sms' as NotificationChannel] : []),
          ...(userPrefs.email ? ['email' as NotificationChannel] : []),
          'in-app' as NotificationChannel
        ]
        
      case 'medium': // Appointment reminders
        return [
          ...(userPrefs.push ? ['push' as NotificationChannel] : []),
          ...(userPrefs.whatsapp ? ['whatsapp' as NotificationChannel] : []),
          ...(userPrefs.email ? ['email' as NotificationChannel] : []),
          'in-app' as NotificationChannel
        ]
        
      case 'low': // Marketing, loyalty updates
        if (!userPrefs.marketing) return [] // Respect opt-out
        return [
          'email' as NotificationChannel,
          ...(userPrefs.push ? ['push' as NotificationChannel] : []),
          'in-app' as NotificationChannel
        ]
        
      default:
        return ['email' as NotificationChannel, 'in-app' as NotificationChannel]
    }
  }

  private static async getUserPreferences(userId: string): Promise<NotificationPreference> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Default preferences if none set
    return data || {
      userId,
      sms: false,      // Expensive - opt-in only
      email: true,     // Cheap - default on
      push: true,      // Cheap - default on
      whatsapp: false, // Medium cost - opt-in
      marketing: false // Always opt-in required
    }
  }

  private static async sendViaChannel(
    channel: NotificationChannel,
    message: string,
    userId: string
  ) {
    switch (channel) {
      case 'sms':
        return await this.sendSMS(message, userId)
      case 'email':
        return await this.sendEmail(message, userId)
      case 'push':
        return await this.sendPush(message, userId)
      case 'whatsapp':
        return await this.sendWhatsApp(message, userId)
      case 'in-app':
        return await this.sendInApp(message, userId)
    }
  }

  // Cost tracking for analytics
  static async trackNotificationCost(
    channel: NotificationChannel,
    success: boolean,
    userId: string
  ) {
    const cost = NOTIFICATION_COSTS.find(c => c.channel === channel)?.costPerMessage || 0
    
    const supabase = createClient()
    await supabase.from('notification_costs').insert({
      user_id: userId,
      channel,
      cost,
      success,
      sent_at: new Date().toISOString()
    })
  }

  // Monthly cost analysis
  static async getMonthlyNotificationCosts(month: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('notification_costs')
      .select('channel, cost, success')
      .gte('sent_at', `${month}-01`)
      .lt('sent_at', `${month}-31`)
    
    return data?.reduce((acc, record: { channel: NotificationChannel; cost: number; success: boolean }) => {
      acc[record.channel] = (acc[record.channel] || 0) + record.cost
      return acc
    }, {} as Record<NotificationChannel, number>) || {}
  }

  // Placeholder methods - implement with actual services
  private static async sendSMS(message: string, userId: string) {
    // Implement with Twilio
    throw new Error('SMS sending not implemented')
  }

  private static async sendEmail(message: string, userId: string) {
    // Implement with SendGrid
    throw new Error('Email sending not implemented')
  }

  private static async sendPush(message: string, userId: string) {
    // Implement with Firebase/OneSignal
    throw new Error('Push sending not implemented')
  }

  private static async sendWhatsApp(message: string, userId: string) {
    // Implement with WhatsApp Business API
    throw new Error('WhatsApp sending not implemented')
  }

  private static async sendInApp(message: string, userId: string) {
    // Store in database for in-app display
    const supabase = createClient()
    return await supabase.from('in_app_notifications').insert({
      user_id: userId,
      message,
      read: false,
      created_at: new Date().toISOString()
    })
  }
}

// Usage examples:
export const NotificationTemplates = {
  // HIGH PRIORITY (SMS + Email)
  bookingConfirmation: (customerName: string, service: string, date: string) => ({
    message: `Hi ${customerName}! Your ${service} appointment is confirmed for ${date}. See you soon! - Pandora Beauty`,
    priority: 'high' as NotificationPriority,
    type: 'booking' as const
  }),

  // MEDIUM PRIORITY (Push + WhatsApp + Email)
  appointmentReminder: (customerName: string, hours: number) => ({
    message: `Reminder: ${customerName}, your appointment is in ${hours} hours. We're excited to see you!`,
    priority: 'medium' as NotificationPriority,
    type: 'reminder' as const
  }),

  // LOW PRIORITY (Email + Push only)
  loyaltyReward: (customerName: string, points: number) => ({
    message: `Congratulations ${customerName}! You've earned ${points} loyalty points. Redeem for exclusive rewards!`,
    priority: 'low' as NotificationPriority,
    type: 'loyalty' as const
  }),

  // MARKETING (Email only, opt-in required)
  monthlyPromotion: (discount: string) => ({
    message: `🎉 Special offer: ${discount} off your next appointment! Book now to save.`,
    priority: 'low' as NotificationPriority,
    type: 'marketing' as const
  })
}
