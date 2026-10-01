'use client'

import { useParams } from 'next/navigation'
import { EventEditor } from '@/components/events/event-editor'

export default function EditSpecialEventPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <EventEditor
      manageTeam={false}
      backHref={`/dashboard/events/${id}`}
      backLabel="Volver al evento"
      afterDeleteHref="/dashboard/special-events"
    />
  )
}
