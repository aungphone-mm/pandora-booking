'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'

type Staff = {
  id: string
  full_name: string
  position: string
  specializations: string[] | null
  bio: string
  is_active: boolean
}

type Service = {
  id: string
  name: string
  price: number
  duration: number
  category?: {
    name: string
  }
}

type Product = {
  id: string
  name: string
  price: number
  category_id: string
  category?: {
    name: string
  }
}

type ProductCategory = {
  id: string
  name: string
  display_order: number
}

type TimeSlot = {
  id: string
  time: string
  is_active: boolean
}

type FormData = {
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceId: string
  staffId: string
  appointmentDate: string
  appointmentTime: string
  products: string[]
  notes: string
}

export default function SinglePageBookingForm({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true) // Add loading state for data
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]) 
  const [products, setProducts] = useState<Product[]>([])
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [totalPrice, setTotalPrice] = useState(0)
  const [showRegisterNotice, setShowRegisterNotice] = useState(!user)
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      customerName: user?.user_metadata?.full_name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.user_metadata?.phone || '',
      staffId: '',
      products: []
    }
  })

  const selectedServiceId = watch('serviceId')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    calculateTotal()
  }, [selectedServiceId, selectedProducts])

  useEffect(() => {
    // Filter staff who can perform the selected service
    if (selectedServiceId && staff.length > 0) {
      // For now, show all active staff. In a full implementation,
      // you would filter based on staff_services table
      setAvailableStaff(staff.filter(s => s && s.id)) // Add null check
    } else {
      setAvailableStaff([])
    }
  }, [selectedServiceId, staff])

  const loadData = async () => {
    setDataLoading(true) // Set loading state
    try {
      // Load services with categories
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(name)
        `)
        .eq('is_active', true)
        .order('category_id')

      if (servicesError) {
        console.error('Error loading services:', servicesError)
        setError('Failed to load services. Please refresh the page.')
        return
      }

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('full_name')

      if (staffError) {
        console.error('Error loading staff:', staffError)
        setError('Failed to load staff. Please refresh the page.')
        return
      }

      // Load products with categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .eq('is_active', true)
        .order('category_id')

      if (productsError) {
        console.error('Error loading products:', productsError)
      }

      // Load product categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order')

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
      }

      // Load time slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .order('time')

      if (slotsError) {
        console.error('Error loading time slots:', slotsError)
        setError('Failed to load time slots. Please refresh the page.')
        return
      }

      setServices(servicesData || [])
      setStaff(staffData || [])
      setProducts(productsData || [])
      setProductCategories(categoriesData || [])
      setTimeSlots(slotsData || [])
    } catch (err) {
      console.error('Unexpected error loading data:', err)
      setError('An unexpected error occurred. Please refresh the page.')
    } finally {
      setDataLoading(false) // Clear loading state
    }
  }
  
  const checkAvailability = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date)
        .eq('status', 'confirmed')
      
      if (error) {
        console.error('Error checking availability:', error)
        return
      }

      const bookedSlots = data?.map(apt => apt.appointment_time) || []
      const available = timeSlots
        .filter(slot => slot && !bookedSlots.includes(slot.time))
        .map(slot => slot.time)
      setAvailableSlots(available)
    } catch (err) {
      console.error('Unexpected error checking availability:', err)
    }
  }

  const calculateTotal = () => {
    const selectedService = services.find(s => s && s.id === selectedServiceId)
    const servicePrice = selectedService?.price || 0
    
    const productsPrice = Array.from(selectedProducts).reduce((sum, productId) => {
      const product = products.find(p => p && p.id === productId)
      return sum + (product?.price || 0)
    }, 0)
    
    setTotalPrice(servicePrice + productsPrice)
  }

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
    setValue('products', Array.from(newSelected))
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    
    try {
      // Validate date format
      if (!data.appointmentDate) {
        setError('Please select an appointment date.')
        setLoading(false)
        return
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user?.id || null,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          service_id: data.serviceId,
          staff_id: data.staffId || null,
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime,
          notes: data.notes,
          status: 'pending'
        })
        .select()
        .single()
      
      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError)
        setError(`Failed to create appointment: ${appointmentError.message}`)
        setLoading(false)
        return
      }

      if (!appointment) {
        setError('No appointment was created. Please try again.')
        setLoading(false)
        return
      }
      
      // Add products if selected
      if (data.products && data.products.length > 0) {
        const productInserts = data.products.map(productId => ({
          appointment_id: appointment.id,
          product_id: productId,
          quantity: 1
        }))
        
        const { error: productsError } = await supabase
          .from('appointment_products')
          .insert(productInserts)
        
        if (productsError) {
          console.error('Products insertion error:', productsError)
        }
      }
      
      router.push('/confirmation')
    } catch (err) {
      console.error('Unexpected error during submission:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!service) return acc
    const category = service.category?.name || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!product) return acc
    const categoryId = product.category_id
    if (!acc[categoryId]) acc[categoryId] = []
    acc[categoryId].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  // Add loading state
  if (dataLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #ec4899',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px'
          }}>Loading Booking Form</h2>
          <p style={{
            color: '#6b7280'
          }}>Please wait while we prepare your booking experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '48px 0'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Book Your Appointment
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280'
          }}>
            Experience luxury beauty treatments in our relaxing environment
          </p>
        </div>

        {/* Guest Registration Notice */}
        {showRegisterNotice && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              color: 'white',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowRegisterNotice(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                💫 Get More with a Free Account!
              </h3>
              <p style={{
                opacity: 0.9,
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}>
                You're booking as a guest. Create a free account to unlock exclusive benefits!
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                    Appointment History
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    View & manage all bookings
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📧</div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                    Email Confirmations
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Automatic booking updates
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                    Quick Rebooking
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    One-click repeat visits
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎁</div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>
                    Member Perks
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Exclusive offers & discounts
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Link
                  href="/auth/register"
                  style={{
                    backgroundColor: '#ec4899',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  Create Free Account
                </Link>
                <Link
                  href="/auth/login"
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            
            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #f87171',
                padding: '24px'
              }}>
                <div style={{
                  color: '#b91c1c',
                  fontWeight: '500'
                }}>
                  {error}
                </div>
              </div>
            )}

            <div style={{
              padding: '32px'
            }}>

              {/* Service Selection - MOVED TO FIRST */}
              <section style={{ marginBottom: '40px' }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Choose Your Service</h2>
                  <p style={{
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>Select the service you'd like to book</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                    <div key={category} style={{ marginBottom: '32px' }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '20px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #ec4899'
                      }}>{category}</h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '20px'
                      }}>
                        {categoryServices.map(service => service && (
                          <label key={service.id} style={{ cursor: 'pointer' }}>
                            <input
                              type="radio"
                              {...register('serviceId', { required: 'Please select a service' })}
                              value={service.id}
                              style={{ display: 'none' }}
                            />
                            <div style={{
                              padding: '24px',
                              border: selectedServiceId === service.id
                                ? '3px solid #ec4899'
                                : '2px solid #e5e7eb',
                              borderRadius: '12px',
                              backgroundColor: selectedServiceId === service.id
                                ? '#fdf2f8'
                                : 'white',
                              boxShadow: selectedServiceId === service.id
                                ? '0 8px 25px rgba(236, 72, 153, 0.15)'
                                : '0 4px 6px rgba(0, 0, 0, 0.05)',
                              transform: selectedServiceId === service.id ? 'translateY(-2px)' : 'none',
                              transition: 'all 0.2s ease'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12px'
                              }}>
                                <h4 style={{
                                  fontWeight: '700',
                                  color: '#111827',
                                  fontSize: '1.125rem',
                                  marginBottom: '4px'
                                }}>{service.name}</h4>
                                <div style={{
                                  backgroundColor: selectedServiceId === service.id ? '#ec4899' : '#f3f4f6',
                                  color: selectedServiceId === service.id ? 'white' : '#111827',
                                  padding: '8px 12px',
                                  borderRadius: '20px',
                                  fontSize: '1.25rem',
                                  fontWeight: 'bold',
                                  minWidth: '80px',
                                  textAlign: 'center'
                                }}>{service.price}Ks</div>
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#6b7280',
                                fontSize: '0.95rem'
                              }}>
                                <span>⏱️</span>
                                <span>{service.duration} minutes</span>
                              </div>
                              {selectedServiceId === service.id && (
                                <div style={{
                                  marginTop: '12px',
                                  padding: '8px',
                                  backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                  borderRadius: '6px',
                                  fontSize: '0.875rem',
                                  color: '#be185d',
                                  fontWeight: '500'
                                }}>
                                  ✓ Selected
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {errors.serviceId && (
                    <p style={{
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      marginTop: '8px'
                    }}>{errors.serviceId.message}</p>
                  )}
                </div>
              </section>

              {/* Personal Information Section - MOVED TO SECOND */}
              <section style={{ marginBottom: '40px' }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Personal Information</h2>
                  <p style={{
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>Tell us about yourself</p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Full Name *
                    </label>
                    <input
                      {...register('customerName', { required: 'Name is required' })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="Enter your full name"
                    />
                    {errors.customerName && (
                      <p style={{
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginTop: '4px'
                      }}>{errors.customerName.message}</p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('customerEmail', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="your@email.com"
                    />
                    {errors.customerEmail && (
                      <p style={{
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginTop: '4px'
                      }}>{errors.customerEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Phone Number *
                    </label>
                    <input
                      {...register('customerPhone', { required: 'Phone is required' })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="(123) 456-7890"
                    />
                    {errors.customerPhone && (
                      <p style={{
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginTop: '4px'
                      }}>{errors.customerPhone.message}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Date & Time Selection */}
              <section style={{ marginBottom: '40px' }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Date & Time</h2>
                  <p style={{
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>When would you like to visit us?</p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      {...register('appointmentDate', { required: 'Date is required' })}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                    {errors.appointmentDate && (
                      <p style={{
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginTop: '4px'
                      }}>{errors.appointmentDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Preferred Time *
                    </label>
                    <select
                      {...register('appointmentTime', { required: 'Please select a time' })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      disabled={!selectedDate || availableSlots.length === 0}
                    >
                      <option value="">Select a time</option>
                      {availableSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.appointmentTime && (
                      <p style={{
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        marginTop: '4px'
                      }}>{errors.appointmentTime.message}</p>
                    )}
                    {selectedDate && availableSlots.length === 0 && (
                      <p style={{
                        color: '#d97706',
                        fontSize: '0.875rem',
                        marginTop: '4px'
                      }}>No available time slots for this date</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Products (Optional) */}
              <section style={{ marginBottom: '40px' }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Add Products (Optional)</h2>
                  <p style={{
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>Enhance your experience with our premium products</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  {productCategories.filter(category => category && category.id).map(category => {
                    const categoryProducts = productsByCategory[category.id] || []
                    if (categoryProducts.length === 0) return null
                    
                    return (
                      <div key={category.id} style={{ marginBottom: '24px' }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '500',
                          color: '#111827',
                          marginBottom: '16px'
                        }}>{category.name}</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {categoryProducts.filter(product => product && product.id).map(product => (
                            <label key={product.id} style={{ cursor: 'pointer' }}>
                              <div style={{
                                padding: '16px',
                                border: selectedProducts.has(product.id) 
                                  ? '1px solid #7c3aed' 
                                  : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                backgroundColor: selectedProducts.has(product.id) 
                                  ? '#f3f4f6' 
                                  : 'white'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={() => handleProductToggle(product.id)}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      marginRight: '12px'
                                    }}
                                  />
                                  <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <span style={{
                                      fontWeight: '500',
                                      color: '#111827'
                                    }}>{product.name || 'Unknown Product'}</span>
                                    <span style={{
                                      color: '#7c3aed',
                                      fontWeight: '600'
                                    }}>{product.price || 0}Ks</span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Notes */}
              <section style={{ marginBottom: '40px' }}>
                <div style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '16px',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Special Requests</h2>
                  <p style={{
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>Any additional information we should know?</p>
                </div>

                <textarea
                  {...register('notes')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  rows={4}
                  placeholder="Any special requests or information we should know?"
                />
              </section>

              {/* Price Summary */}
              {totalPrice > 0 && (
                <section style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>Total Estimated Cost:</span>
                    <span style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#ec4899'
                    }}>{totalPrice.toFixed(2)}Ks</span>
                  </div>
                </section>
              )}

              {/* Submit Button */}
              <div style={{ paddingTop: '24px' }}>
                <button
                  type="submit"
                  disabled={loading || services.length === 0}
                  style={{
                    width: '100%',
                    backgroundColor: loading || services.length === 0 ? '#9ca3af' : '#ec4899',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: loading || services.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Booking Your Appointment...' : 'Book Appointment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}