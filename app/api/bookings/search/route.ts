import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // First, try to fetch appointment with new multi-service format
    let appointment: any = null
    let error: any = null
    let services: any[] = []

    // Try fetching with new appointment_services table (multiple services)
    try {
      const result = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_services (
            id,
            quantity,
            price,
            service:services (
              id,
              name,
              price,
              duration
            )
          ),
          appointment_products (
            id,
            quantity,
            product:products (
              id,
              name,
              price
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      appointment = result.data
      error = result.error

      // Log debug information for troubleshooting
      if (error) {
        console.error('Booking search - appointment_services query error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          bookingId
        })
      }

      // Check if appointment_services array exists but is empty (possible RLS issue)
      if (appointment && Array.isArray(appointment.appointment_services)) {
        console.log('Booking search - appointment_services array length:', appointment.appointment_services.length)
        
        // Check if any service data is null (indicates RLS blocking)
        const hasNullServices = appointment.appointment_services.some((as: any) => !as.service)
        if (hasNullServices) {
          console.warn('Booking search - Some appointment_services have null service data (possible RLS issue)')
        }
      }

      // Check if appointment_products array exists but is empty (possible RLS issue)
      if (appointment && Array.isArray(appointment.appointment_products)) {
        console.log('Booking search - appointment_products array length:', appointment.appointment_products.length)
        
        // Check if any product data is null (indicates RLS blocking)
        const hasNullProducts = appointment.appointment_products.some((ap: any) => !ap.product)
        if (hasNullProducts) {
          console.warn('Booking search - Some appointment_products have null product data (possible RLS issue)')
        }
      } else if (appointment && !appointment.appointment_products) {
        console.log('Booking search - appointment_products is null/undefined (may be RLS blocked or no products)')
      }

      if (appointment?.appointment_services && appointment.appointment_services.length > 0) {
        // Filter out any entries where service is null (RLS blocked)
        const validServices = appointment.appointment_services.filter((as: any) => as.service)
        
        if (validServices.length !== appointment.appointment_services.length) {
          console.warn(`Booking search - Filtered out ${appointment.appointment_services.length - validServices.length} services due to missing service data`)
        }

        services = validServices.map((as: any) => ({
          id: as.service.id,
          name: as.service.name,
          price: as.price,
          duration: as.service.duration,
          quantity: as.quantity
        }))
        
        console.log('Booking search - Successfully mapped services:', services.length)
      } else if (appointment && !appointment.appointment_services) {
        console.log('Booking search - appointment_services is null/undefined (may be RLS blocked or not using new format)')
      } else if (appointment && Array.isArray(appointment.appointment_services) && appointment.appointment_services.length === 0) {
        console.log('Booking search - appointment_services array is empty (no services found or RLS blocked)')
      }
    } catch (err) {
      console.error('Booking search - New format query exception:', err)
    }

    // Fallback: If new format doesn't work or has no services, try old format (single service_id)
    if (!appointment || (services.length === 0 && appointment?.service_id)) {
      console.log('Booking search - Attempting fallback to old format (service_id)')
      
      const result = await supabase
        .from('appointments')
        .select(`
          *,
          service:services (
            id,
            name,
            price,
            duration
          ),
          appointment_products (
            id,
            quantity,
            product:products (
              id,
              name,
              price
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      appointment = result.data
      error = result.error

      if (error) {
        console.error('Booking search - Fallback query error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          bookingId
        })
      }

      // Format old single-service format as array
      if (appointment?.service) {
        services = [{
          id: appointment.service.id,
          name: appointment.service.name,
          price: appointment.service.price,
          duration: appointment.service.duration,
          quantity: 1
        }]
        console.log('Booking search - Found service using old format (service_id)')
      } else if (appointment && appointment.service_id) {
        console.warn('Booking search - Appointment has service_id but service relation is null (possible RLS issue)')
      }
    }

    if (error || !appointment) {
      console.error('Booking search - Final error check:', {
        hasError: !!error,
        hasAppointment: !!appointment,
        errorDetails: error,
        bookingId
      })
      return NextResponse.json(
        { error: 'Booking not found. Please check your Booking ID and try again.' },
        { status: 404 }
      )
    }

    // Process products - filter out any entries where product is null (RLS blocked)
    let products: any[] = []
    if (appointment.appointment_products && Array.isArray(appointment.appointment_products)) {
      // Filter out any entries where product is null (RLS blocked)
      const validProducts = appointment.appointment_products.filter((ap: any) => ap.product)
      
      if (validProducts.length !== appointment.appointment_products.length) {
        console.warn(`Booking search - Filtered out ${appointment.appointment_products.length - validProducts.length} products due to missing product data`)
      }

      products = validProducts.map((ap: any) => ({
        id: ap.product.id,
        name: ap.product.name,
        price: ap.product.price,
        quantity: ap.quantity
      }))
      
      console.log('Booking search - Successfully mapped products:', products.length)
    }

    // Log final service and product counts for debugging
    console.log('Booking search - Final result:', {
      bookingId: appointment.id,
      servicesCount: services.length,
      productsCount: products.length,
      hasServiceId: !!appointment.service_id,
      userId: appointment.user_id
    })

    // Format the response
    const response = {
      id: appointment.id,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      customerPhone: appointment.customer_phone,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      totalPrice: appointment.total_price,
      status: appointment.status,
      notes: appointment.notes,
      services: services,
      products: products,
      createdAt: appointment.created_at
    }

    return NextResponse.json(response)
  } catch (err: any) {
    console.error('Error fetching booking:', err)
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    )
  }
}
