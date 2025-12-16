// Enhanced booking API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const supabase = createClient()

    // 1. Calculate total price first (services + products)
    // Support both old format (serviceId) and new format (serviceIds array)
    const serviceIds = data.serviceIds || (data.serviceId ? [data.serviceId] : [])
    
    if (!serviceIds || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one service must be selected' },
        { status: 400 }
      )
    }

    const { data: selectedServices } = await supabase
      .from('services')
      .select('id, price')
      .in('id', serviceIds)

    const servicesPrice = selectedServices?.reduce((sum, s) => sum + (s.price || 0), 0) || 0

    const { data: selectedProducts } = await supabase
      .from('products')
      .select('price')
      .in('id', data.products || [])

    const productsTotal = selectedProducts?.reduce((sum, p) => sum + p.price, 0) || 0
    const totalAmount = servicesPrice + productsTotal

    // 2. Create appointment in database with total_price and staff_id
    // Note: service_id is set to null since we're using appointment_services junction table
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: data.user_id || null,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        service_id: null, // Using appointment_services table instead
        staff_id: data.staffId || null,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        notes: data.notes,
        status: 'pending',
        total_price: totalAmount
      })
      .select('*')
      .single()

    if (appointmentError) {
      throw new Error('Failed to create appointment')
    }

    // 3. Insert service associations into appointment_services table
    if (serviceIds.length > 0 && appointment) {
      const serviceInserts = serviceIds.map((serviceId: string) => {
        const service = selectedServices?.find(s => s.id === serviceId)
        return {
          appointment_id: appointment.id,
          service_id: serviceId,
          quantity: 1,
          price: service?.price || 0
        }
      })

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(serviceInserts)

      if (servicesError) {
        console.error('Error inserting appointment_services:', servicesError)
        throw new Error('Failed to associate services with appointment')
      }
    }

    // 4. Add products if selected
    if (data.products?.length > 0) {
      const productInserts = data.products.map((productId: string) => ({
        appointment_id: appointment.id,
        product_id: productId,
        quantity: 1
      }))

      const { error: productsError } = await supabase
        .from('appointment_products')
        .insert(productInserts)

      if (productsError) {
        console.error('Error inserting appointment_products:', productsError)
        throw new Error('Failed to associate products with appointment')
      }
    }

    // 5. Payment integration removed
    let paymentDetails = null

    // 6. SMS integration removed

    // 7. Calendar integration removed

    // 8. Return success with payment details if needed
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        serviceIds: serviceIds,
        services: selectedServices?.map(s => ({ id: s.id, price: s.price })) || [],
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
