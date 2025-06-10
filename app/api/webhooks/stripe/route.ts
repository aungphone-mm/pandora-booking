// Stripe Webhook Handler - Payment Confirmations
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/integrations/twilio'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  try {
    const body = await request.text()
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    const supabase = createClient()

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, supabase)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object, supabase)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handling failed' }, 
      { status: 400 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: any, supabase: any) {
  const appointmentId = paymentIntent.metadata.appointmentId
  
  try {
    // 1. Update appointment status to confirmed
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ 
        status: 'confirmed',
        payment_status: 'paid',
        payment_intent_id: paymentIntent.id
      })
      .eq('id', appointmentId)
      .select(`
        *,
        service:services(name)
      `)
      .single()

    if (error) throw error

    // 2. Send payment confirmation SMS
    const paymentAmount = (paymentIntent.amount / 100).toFixed(2)
    const message = `Payment confirmed! ${appointment.customer_name}, your ${appointment.service.name} appointment on ${appointment.appointment_date} is now confirmed. Amount paid: $${paymentAmount} - Pandora Beauty Salon`
    
    await sendSMS({
      to: appointment.customer_phone,
      message,
      appointmentId
    })

    console.log(`Payment confirmed for appointment ${appointmentId}`)
    
  } catch (error) {
    console.error('Payment success handling error:', error)
  }
}

async function handlePaymentFailure(paymentIntent: any, supabase: any) {
  const appointmentId = paymentIntent.metadata.appointmentId
  
  try {
    // 1. Update appointment with payment failure
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ 
        payment_status: 'failed',
        notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
      })
      .eq('id', appointmentId)
      .select('*')
      .single()

    if (error) throw error

    // 2. Send payment failure notification SMS
    const message = `Payment failed for your appointment. Please contact us at (123) 456-7890 or try booking again. - Pandora Beauty Salon`
    
    await sendSMS({
      to: appointment.customer_phone,
      message,
      appointmentId
    })

    console.log(`Payment failed for appointment ${appointmentId}`)
    
  } catch (error) {
    console.error('Payment failure handling error:', error)
  }
}
