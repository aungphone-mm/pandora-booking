import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/BookingForm'
import { redirect } from 'next/navigation'

export default async function BookingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto px-4 py-8">
      <BookingForm user={user} />
    </div>
  )
}
