// Enhanced booking API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // 4. Payment integration removed
    let paymentDetails = null

    // 5. SMS integration removed

    // 6. Calendar integration removed

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
