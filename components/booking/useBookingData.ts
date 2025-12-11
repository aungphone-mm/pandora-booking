/**
 * Custom hook for booking form data management
 * Handles loading services, staff, products, and availability checking
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service, Staff, Product, ProductCategory, TimeSlot } from './types'

export function useBookingData() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [servicesData, staffData, productsData, categoriesData, slotsData] = await Promise.all([
        supabase.from('services').select('*, category:service_categories(name)').eq('is_active', true),
        supabase.from('staff').select('*').eq('is_active', true),
        supabase.from('products').select('*, category:product_categories(name)').eq('is_active', true),
        supabase.from('product_categories').select('*').order('display_order'),
        supabase.from('time_slots').select('*').eq('is_active', true).order('time')
      ])

      if (servicesData.error) throw servicesData.error
      if (staffData.error) throw staffData.error
      if (productsData.error) throw productsData.error
      if (categoriesData.error) throw categoriesData.error
      if (slotsData.error) throw slotsData.error

      setServices(servicesData.data || [])
      setStaff(staffData.data || [])
      setProducts(productsData.data || [])
      setProductCategories(categoriesData.data || [])
      setTimeSlots(slotsData.data || [])
    } catch (error) {
      console.error('Error loading booking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date)
        .in('status', ['confirmed', 'pending'])

      if (error) throw error

      const bookedSlots = data?.map(apt => apt.appointment_time) || []
      const available = timeSlots
        .filter(slot => !bookedSlots.includes(slot.time))
        .map(slot => slot.time)

      setAvailableSlots(available)
    } catch (error) {
      console.error('Error checking availability:', error)
      setAvailableSlots([])
    }
  }

  return {
    loading,
    services,
    staff,
    products,
    productCategories,
    timeSlots,
    availableSlots,
    checkAvailability
  }
}
