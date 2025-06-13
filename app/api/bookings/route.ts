// Enhanced booking API with integrations
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentIntent } from '@/lib/integrations/stripe'
import { sendBookingConfirmation } from '@/lib/integrations/twilio'
// import { createSalonAppointment } from '@/lib/integrations/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createClient()
    
    // 1. Create appointment in database (existing logic)
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: data.user_id || null,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        service_id: data.serviceId,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        notes: data.notes,
        status: 'pending'
      })
      .select(`
        *,
        service:services(name, price, duration)
      `)
      .single()
    
    if (appointmentError) {
      throw new Error('Failed to create appointment')
    }

    // 2. Add products if selected
    if (data.products?.length > 0) {
      const productInserts = data.products.map((productId: string) => ({
        appointment_id: appointment.id,
        product_id: productId,
        quantity: 1
      }))
      
      await supabase
        .from('appointment_products')
        .insert(productInserts)
    }

    // 3. Calculate total for payment
    const servicePrice = appointment.service.price
    const { data: selectedProducts } = await supabase
      .from('products')
      .select('price')
      .in('id', data.products || [])
    
    const productsTotal = selectedProducts?.reduce((sum, p) => sum + p.price, 0) || 0
    const totalAmount = servicePrice + productsTotal

    // 4. CREATE PAYMENT INTENT (if payment required)
    let paymentDetails = null
    if (data.requirePayment && totalAmount > 0) {
      try {
        if (process.env.STRIPE_SECRET_KEY) {
          paymentDetails = await createPaymentIntent({
            amount: Math.round(totalAmount * 100), // Convert to cents
            customerEmail: data.customerEmail,
            appointmentId: appointment.id,
            metadata: {
              service: appointment.service.name,
              date: data.appointmentDate,
              time: data.appointmentTime
            }
          })
        } else {
          console.warn('Stripe not configured, skipping payment processing')
        }
      } catch (paymentError) {
        console.warn('Payment processing failed:', paymentError)
        // Don't fail the booking if payment fails
      }
    }

    // 5. SEND SMS CONFIRMATION
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        await sendBookingConfirmation(
          data.customerPhone,
          data.customerName,
          appointment.service.name,
          data.appointmentDate,
          data.appointmentTime
        )
      } else {
        console.warn('Twilio not configured, skipping SMS')
      }
    } catch (smsError) {
      console.warn('SMS sending failed:', smsError)
      // Don't fail the booking if SMS fails
    }

    // 6. CREATE CALENDAR EVENT
    try {
      // const startDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`)
      // const endDateTime = new Date(startDateTime.getTime() + (appointment.service.duration * 60000))
      
      // await createSalonAppointment({
      //   summary: `${appointment.service.name} - ${data.customerName}`,
      //   description: `Customer: ${data.customerName}\nPhone: ${data.customerPhone}\nEmail: ${data.customerEmail}\nNotes: ${data.notes || 'None'}`,
      //   startDateTime: startDateTime.toISOString(),
      //   endDateTime: endDateTime.toISOString(),
      //   customerEmail: data.customerEmail,
      //   location: 'Pandora Beauty Salon'
      // })
    } catch (calendarError) {
      console.warn('Calendar creation failed:', calendarError)
      // Don't fail the booking if calendar fails
    }

    // 7. Return success with payment details if needed
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        service: appointment.service.name,
        date: data.appointmentDate,
        time: data.appointmentTime,
        total: totalAmount
      },
      payment: paymentDetails,
      message: 'Appointment created successfully!'
    })

  } catch (error) {
    console.error('Enhanced booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
