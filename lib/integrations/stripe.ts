// Stripe Payment Integration
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export interface PaymentIntent {
  amount: number // in cents
  customerEmail: string
  appointmentId: string
  metadata?: Record<string, string>
}

export const createPaymentIntent = async (payment: PaymentIntent) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payment.amount,
      currency: 'usd', // or 'mmk' for Myanmar Kyat
      receipt_email: payment.customerEmail,
      metadata: {
        appointmentId: payment.appointmentId,
        ...payment.metadata
      }
    })
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  } catch (error) {
    console.error('Stripe payment error:', error)
    throw new Error('Payment processing failed')
  }
}

export const confirmPayment = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent.status === 'succeeded'
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return false
  }
}

// Refund for cancelled appointments
export const processRefund = async (paymentIntentId: string, amount?: number) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount // partial refund if specified
    })
    return refund
  } catch (error) {
    console.error('Refund error:', error)
    throw new Error('Refund processing failed')
  }
}
