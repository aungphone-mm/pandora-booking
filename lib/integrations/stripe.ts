// Stripe Payment Integration
import Stripe from 'stripe'

// Lazy initialization of Stripe client
let stripe: Stripe | null = null

const getStripeClient = () => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    if (!secretKey) {
      throw new Error('Stripe secret key not configured')
    }
    
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil'
    })
  }
  return stripe
}

export interface PaymentIntent {
  amount: number // in cents
  customerEmail: string
  appointmentId: string
  metadata?: Record<string, string>
}

export const createPaymentIntent = async (payment: PaymentIntent) => {
  try {
    const stripeClient = getStripeClient()
    const paymentIntent = await stripeClient.paymentIntents.create({
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
    const stripeClient = getStripeClient()
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent.status === 'succeeded'
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return false
  }
}

// Refund for cancelled appointments
export const processRefund = async (paymentIntentId: string, amount?: number) => {
  try {
    const stripeClient = getStripeClient()
    const refund = await stripeClient.refunds.create({
      payment_intent: paymentIntentId,
      amount // partial refund if specified
    })
    return refund
  } catch (error) {
    console.error('Refund error:', error)
    throw new Error('Refund processing failed')
  }
}
