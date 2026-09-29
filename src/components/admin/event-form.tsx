'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Textarea, Button } from '@/components/ui'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventType } from '@/types'

export const eventSchema = z
  .object({
    title: z.string().trim().min(2, 'Mínimo 2 caracteres'),
    event_type: z.enum(['rehearsal', 'service', 'saturday']),
    date: z.string().min(1, 'La fecha es requerida'),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    location: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((v) => !v.start_time || !v.end_time || v.end_time > v.start_time, {
    message: 'La hora de fin debe ser posterior al inicio',
    path: ['end_time'],
  })

export type EventFormValues = z.infer<typeof eventSchema>

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'service', label: 'Culto' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'rehearsal', label: 'Ensayo' },
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
  onSubmit: (values: EventFormValues) => void | Promise<void>
  submitLabel: string
  saving?: boolean
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      event_type: 'service',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      notes: '',
      ...defaultValues,
    },
  })

  const selectedType = watch('event_type')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl" noValidate>
      <fieldset>
        <legend className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
          Tipo de evento
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {eventTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={selectedType === t.value}
              onClick={() => setValue('event_type', t.value, { shouldDirty: true })}
              className={cn(
                'min-h-11 rounded-[var(--radius-md)] border text-sm font-medium transition-colors',
                selectedType === t.value
                  ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                  : 'bg-[var(--bg-raised)] text-[var(--text-secondary)] border-[var(--border-normal)] hover:text-[var(--text-primary)]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Input
        id="event-title"
        label="Título"
        placeholder="Ej. Culto dominical"
        autoCapitalize="sentences"
        enterKeyHint="next"
        error={errors.title?.message}
        required
        disabled={saving}
        {...register('title')}
      />

      <Input
        id="event-date"
        label="Fecha"
        type="date"
        error={errors.date?.message}
        required
        disabled={saving}
        {...register('date')}
      />

      <div className="grid grid-cols-2 gap-3">
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

      <Input
        id="event-location"
        label="Lugar (opcional)"
        placeholder="Ej. Templo principal"
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

      <div
        className={cn(
          'fixed sm:static inset-x-0 z-[260] bottom-[calc(var(--bottom-nav-h)+var(--safe-bottom))]',
          'border-t sm:border-0 border-[var(--border-normal)] bg-[var(--bg-page)]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none',
          'px-4 py-3 sm:p-0 flex sm:justify-end'
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
    date: values.date,
    start_time: values.start_time || null,
    end_time: values.end_time || null,
    location: values.location || null,
    notes: values.notes || null,
  }
}
