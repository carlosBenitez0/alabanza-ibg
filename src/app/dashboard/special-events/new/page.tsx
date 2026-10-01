'use client'

import { NewEvent } from '@/components/events/new-event'

export default function NewSpecialEventPage() {
  return <NewEvent backHref="/dashboard/special-events" detailHref={(id) => `/dashboard/events/${id}`} />
}
