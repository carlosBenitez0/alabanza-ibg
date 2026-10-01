'use client'

import { NewEvent } from '@/components/events/new-event'

export default function AdminNewEventPage() {
  return <NewEvent backHref="/admin/events" detailHref={(id) => `/admin/events/${id}`} />
}
