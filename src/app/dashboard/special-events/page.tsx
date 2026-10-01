'use client'

import { EventsList } from '@/components/events/events-list'

export default function SpecialEventsPage() {
  return <EventsList detailHref={(id) => `/dashboard/events/${id}`} newHref="/dashboard/special-events/new" />
}
