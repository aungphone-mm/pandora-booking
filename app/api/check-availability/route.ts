import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date')
  
  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
  }

  const supabase = createClient()
  
  // Get all time slots
  const { data: timeSlots } = await supabase
    .from('time_slots')
    .select('*')
    .eq('is_active', true)
    .order('time')
  
  // Get booked appointments for the date
  const { data: bookedAppointments } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('appointment_date', date)
    .eq('status', 'confirmed')
  
  const bookedTimes = bookedAppointments?.map(apt => apt.appointment_time) || []
  const availableSlots = timeSlots?.filter(slot => !bookedTimes.includes(slot.time)) || []
  
  return NextResponse.json({ availableSlots })
}
