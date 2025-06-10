// Twilio SMS Integration
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export interface SMSMessage {
  to: string
  message: string
  appointmentId?: string
}

export const sendSMS = async ({ to, message, appointmentId }: SMSMessage) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    })
    
    console.log(`SMS sent to ${to}: ${result.sid}`)
    return result.sid
  } catch (error) {
    console.error('SMS sending error:', error)
    throw new Error('Failed to send SMS')
  }
}

// Appointment confirmation SMS
export const sendBookingConfirmation = async (
  phone: string, 
  customerName: string, 
  serviceName: string, 
  date: string, 
  time: string
) => {
  const message = `Hi ${customerName}! Your appointment for ${serviceName} is confirmed for ${date} at ${time}. Pandora Beauty Salon - Reply STOP to opt out.`
  
  return sendSMS({ to: phone, message })
}

// Appointment reminder SMS (24 hours before)
export const sendAppointmentReminder = async (
  phone: string,
  customerName: string,
  serviceName: string,
  date: string,
  time: string
) => {
  const message = `Reminder: ${customerName}, your ${serviceName} appointment is tomorrow ${date} at ${time}. See you soon! - Pandora Beauty Salon`
  
  return sendSMS({ to: phone, message })
}

// Pre-appointment reminder (2 hours before)
export const sendPreAppointmentReminder = async (
  phone: string,
  customerName: string,
  time: string
) => {
  const message = `Hi ${customerName}! Your appointment is in 2 hours at ${time}. Please arrive 10 minutes early. - Pandora Beauty Salon`
  
  return sendSMS({ to: phone, message })
}

// Post-service follow-up
export const sendFollowUpSMS = async (
  phone: string,
  customerName: string
) => {
  const message = `Thank you ${customerName}! How was your experience today? We'd love your feedback: [review-link] - Pandora Beauty Salon`
  
  return sendSMS({ to: phone, message })
}

// Promotional SMS for registered users
export const sendPromotionalSMS = async (
  phone: string,
  customerName: string,
  offer: string
) => {
  const message = `Special offer for ${customerName}: ${offer} Book now: [booking-link] - Pandora Beauty Salon. Reply STOP to opt out.`
  
  return sendSMS({ to: phone, message })
}
