// Google Calendar Integration
import { google } from 'googleapis'

const calendar = google.calendar('v3')

// Setup Google Calendar auth
const getAuthClient = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE, // JSON file path
    scopes: ['https://www.googleapis.com/auth/calendar']
  })
  return auth
}

export interface CalendarEvent {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  customerEmail: string
  location?: string
}

// Create appointment in salon's main calendar
export const createSalonAppointment = async (event: CalendarEvent) => {
  try {
    const auth = await getAuthClient()
    
    const response = await calendar.events.insert({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID, // Salon's main calendar
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'Asia/Yangon' // Myanmar timezone
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'Asia/Yangon'
        },
        attendees: [
          { email: event.customerEmail }
        ],
        location: event.location || 'Pandora Beauty Salon',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'popup', minutes: 60 }       // 1 hour
          ]
        }
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Calendar event creation error:', error)
    throw new Error('Failed to create calendar event')
  }
}

// Send calendar invite to customer
export const sendCalendarInvite = async (event: CalendarEvent) => {
  try {
    const auth = await getAuthClient()
    
    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      sendNotifications: true, // Send email invitation
      requestBody: {
        summary: `${event.summary} - Pandora Beauty Salon`,
        description: `${event.description}\n\nLocation: Pandora Beauty Salon\nPhone: (123) 456-7890`,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'Asia/Yangon'
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'Asia/Yangon'
        },
        location: 'Pandora Beauty Salon, [Your Address]',
        attendees: [
          { 
            email: event.customerEmail,
            responseStatus: 'needsAction'
          }
        ]
      }
    })
    
    return response.data.htmlLink // Link to view event
  } catch (error) {
    console.error('Calendar invite error:', error)
    throw new Error('Failed to send calendar invite')
  }
}

// Update appointment when status changes
export const updateAppointment = async (
  eventId: string, 
  updates: Partial<CalendarEvent>
) => {
  try {
    const auth = await getAuthClient()
    
    const response = await calendar.events.patch({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
      requestBody: updates
    })
    
    return response.data
  } catch (error) {
    console.error('Calendar update error:', error)
    throw new Error('Failed to update calendar event')
  }
}

// Cancel appointment
export const cancelAppointment = async (eventId: string) => {
  try {
    const auth = await getAuthClient()
    
    await calendar.events.delete({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
      sendNotifications: true // Notify attendees
    })
    
    return true
  } catch (error) {
    console.error('Calendar cancellation error:', error)
    throw new Error('Failed to cancel calendar event')
  }
}

// Get salon availability for a specific date
export const getSalonAvailability = async (date: string) => {
  try {
    const auth = await getAuthClient()
    
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const response = await calendar.events.list({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    })
    
    return response.data.items || []
  } catch (error) {
    console.error('Calendar availability error:', error)
    throw new Error('Failed to check availability')
  }
}
