import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to booking page
  redirect('/booking')
}