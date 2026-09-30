'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea, Button } from '@/components/ui'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventType } from '@/types'

export const eventSchema = z
  .object({
    title: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    event_type: z.enum(['camp', 'united', 'invitation', 'other']),
    organizer: z.string().trim().optional(),
    date: z.string().min(1, 'La fecha es requerida'),
    end_date: z.string().optional(),
    arrival_time: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    location: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((v) => !v.end_date || v.end_date >= v.date, {
    message: 'Debe ser igual o posterior a la fecha de inicio',
    path: ['end_date'],
  })
  // Times only have to be ordered when everything happens on one day
  .refine((v) => (v.end_date && v.end_date > v.date) || !v.start_time || !v.end_time || v.end_time > v.start_time, {
    message: 'La hora de fin debe ser posterior al inicio',
    path: ['end_time'],
  })
  .refine((v) => !v.arrival_time || !v.start_time || v.arrival_time <= v.start_time, {
    message: 'La llegada debe ser antes del inicio',
    path: ['arrival_time'],
  })

export type EventFormValues = z.infer<typeof eventSchema>

const eventTypes: { value: EventType; label: string; hint: string }[] = [
  { value: 'camp', label: 'Campamento', hint: 'Retiros o campamentos, a veces de varios días' },
  { value: 'united', label: 'Evento unido', hint: 'Varias iglesias juntas, p. ej. una acción de gracias' },
  { value: 'invitation', label: 'Invitación', hint: 'Otra iglesia o grupo nos invita a ministrar' },
  { value: 'other', label: 'Otro', hint: 'Cualquier ocasión especial fuera de los privilegios' },
]

/**
 * Create/edit form for events. One column on phones; the submit
 * button sits in a sticky bar above the bottom nav so it is always reachable.
 */
export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel,
  saving,
}: {
  defaultValues?: Partial<EventFormValues>
  /** Return true when saved so the form becomes pristine again */
  onSubmit: (values: EventFormValues) => boolean | void | Promise<boolean | void>
  submitLabel: string
  saving?: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      event_type: 'invitation',
      organizer: '',
      date: '',
      end_date: '',
      arrival_time: '',
      start_time: '',
      end_time: '',
      location: '',
      notes: '',
      ...defaultValues,
    },
  })

  const selectedType = useWatch({ control, name: 'event_type' })

  const submit = async (values: EventFormValues) => {
    if ((await onSubmit(values)) === true) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5 max-w-2xl" noValidate>
      <fieldset>
        <legend className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
          Tipo de evento
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {eventTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={selectedType === t.value}
              onClick={() => setValue('event_type', t.value, { shouldDirty: true })}
              className={cn(
                'min-h-16 p-3 rounded-[var(--radius-md)] border text-left transition-colors flex flex-col gap-0.5',
                selectedType === t.value
                  ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                  : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] border-[var(--border-normal)] hover:text-[var(--text-primary)]'
              )}
            >
              <span className="text-sm font-semibold">{t.label}</span>
              <span className={cn('text-xs leading-snug', selectedType === t.value ? 'opacity-80' : 'text-[var(--text-tertiary)]')}>
                {t.hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <Input
        id="event-title"
        label="Título"
        placeholder="Ej. Campamento de jóvenes 2026"
        autoCapitalize="sentences"
        enterKeyHint="next"
        error={errors.title?.message}
        required
        disabled={saving}
        {...register('title')}
      />

      <Input
        id="event-organizer"
        label="Organiza / nos invita (opcional)"
        placeholder="Ej. Iglesia Bautista Central"
        autoCapitalize="words"
        enterKeyHint="next"
        disabled={saving}
        {...register('organizer')}
      />

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
        <Input
          id="event-date"
          label="Fecha"
          type="date"
          error={errors.date?.message}
          required
          disabled={saving}
          {...register('date')}
        />
        <Input
          id="event-end-date"
          label="Hasta (opcional)"
          type="date"
          error={errors.end_date?.message}
          disabled={saving}
          {...register('end_date')}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Input
          id="event-arrival"
          label="Llegada"
          type="time"
          error={errors.arrival_time?.message}
          disabled={saving}
          {...register('arrival_time')}
        />
        <Input
          id="event-start"
          label="Inicio"
          type="time"
          error={errors.start_time?.message}
          disabled={saving}
          {...register('start_time')}
        />
        <Input
          id="event-end"
          label="Fin"
          type="time"
          error={errors.end_time?.message}
          disabled={saving}
          {...register('end_time')}
        />
      </div>
      <p className="-mt-3 text-xs text-[var(--text-tertiary)]">
        Llegada: hora para montar equipo o hacer prueba de sonido.
      </p>

      <Input
        id="event-location"
        label="Lugar (opcional)"
        placeholder="Ej. Centro de retiros El Encuentro"
        enterKeyHint="next"
        disabled={saving}
        {...register('location')}
      />

      <Textarea
        id="event-notes"
        label="Notas (opcional)"
        placeholder="Indicaciones para el equipo…"
        disabled={saving}
        className="min-h-[90px]"
        {...register('notes')}
      />

      {/* Phones: when editing, the save bar only floats while there are changes, so it
          doesn't sit over the team and repertoire sections that save on their own */}
      <div
        className={cn(
          'flex sm:justify-end',
          !defaultValues || isDirty
            ? cn(
                'fixed sm:static inset-x-0 z-[260] bottom-[calc(var(--bottom-nav-h)+var(--safe-bottom))] animate-slide-in sm:animate-none',
                'border-t sm:border-0 border-[var(--border-normal)] bg-[var(--bg-page)]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none',
                'px-4 py-3 sm:p-0'
              )
            : 'static'
        )}
      >
        <Button type="submit" loading={saving} disabled={!isDirty && !!defaultValues} className="w-full sm:w-auto">
          <Save className="w-4 h-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

/** Converts form values to the row shape stored in `events` */
export function toEventRow(values: EventFormValues) {
  return {
    title: values.title,
    event_type: values.event_type,
    organizer: values.organizer || null,
    date: values.date,
    end_date: values.end_date && values.end_date !== values.date ? values.end_date : null,
    arrival_time: values.arrival_time || null,
    start_time: values.start_time || null,
    end_time: values.end_time || null,
    location: values.location || null,
    notes: values.notes || null,
  }
}
