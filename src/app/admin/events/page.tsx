'use client'

import { EventsList } from '@/components/events/events-list'

export default function AdminEventsPage() {
  return <EventsList detailHref={(id) => `/admin/events/${id}`} newHref="/admin/events/new" />
}
