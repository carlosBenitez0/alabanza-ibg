'use client'

import { EventEditor } from '@/components/events/event-editor'

export default function AdminEditEventPage() {
  return <EventEditor manageTeam backHref="/admin/events" backLabel="Eventos" afterDeleteHref="/admin/events" />
}
