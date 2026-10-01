'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/providers/toast-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { PageHeader, buttonVariants } from '@/components/ui'
import { EventForm, toEventRow, type EventFormValues } from '@/components/admin/event-form'

interface NewEventProps {
  backHref: string
  /** Where the new event opens once created */
  detailHref: (id: string) => string
}

/** Any member creates special events; the team is told so they can sign up */
export function NewEvent({ backHref, detailHref }: NewEventProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const { user } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleCreate = async (values: EventFormValues) => {
    setSaving(true)
    const { data, error } = await supabase
      .from('events')
      .insert({ ...toEventRow(values), created_by: user?.id ?? null })
      .select('id')
      .single()

    if (error || !data) {
      toast({ title: 'Error', description: 'No se pudo crear el evento. Revisa tu conexión e inténtalo de nuevo.', variant: 'destructive' })
      setSaving(false)
      return false
    }

    // Tell the team so they can sign up (best-effort)
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new_event', eventId: data.id }),
    }).catch(() => {})

    toast({ title: 'Evento creado', description: 'Avisamos al equipo para que se apunte.', variant: 'success' })
    router.replace(detailHref(data.id))
    return true
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <Link href={backHref} className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Eventos
      </Link>
      <PageHeader title="Nuevo Evento" description="Un campamento, un evento con otras iglesias o una invitación a ministrar." />
      <EventForm onSubmit={handleCreate} submitLabel="Crear evento" saving={saving} />
    </div>
  )
}
