'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useProfile } from '@/components/providers/profile-provider'
import { useToast } from '@/components/providers/toast-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { addBackingVocal, removeBackingVocal } from '@/lib/privilege-storage'
import { PRIVILEGES_WITH_BACKING_VOCALS, WeeklyPrivilege, isRemotePrivilege } from '@/types/privileges'
import { Button } from '@/components/ui'
import { Mic2, LogOut, X, Undo2 } from 'lucide-react'

/**
 * Backing vocals (coristas) of one privilege: names, plus "join"/"leave" for the
 * signed-in member and a remove button for the owner and admins.
 */
export function BackingVocals({ privilege, onChanged }: { privilege: WeeklyPrivilege; onChanged: () => void }) {
  const { user } = useAuth()
  const { isAdmin } = useProfile()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  if (!PRIVILEGES_WITH_BACKING_VOCALS.includes(privilege.privilege_key) || !isRemotePrivilege(privilege)) return null

  const vocals = privilege.backing_vocals || []
  const isOwner = user?.id === privilege.profile_id
  const mine = vocals.find((bv) => bv.profile_id === user?.id)
  // Musicians can join too: some play and sing
  const canJoin = Boolean(user) && !isOwner && !mine

  const run = async (key: string, action: () => Promise<string | null>, success: string) => {
    setBusy(key)
    const error = await action()
    setBusy(null)
    if (error) {
      toast({ title: 'No se pudo completar', description: error, variant: 'destructive' })
      return
    }
    toast({ title: success, variant: 'success' })
    onChanged()
  }

  // Removing someone else is one tap, so it comes with an undo instead of a confirm dialog
  const removeOther = async (bv: (typeof vocals)[number]) => {
    setBusy(bv.id)
    const error = await removeBackingVocal(supabase, bv.id)
    setBusy(null)
    if (error) {
      toast({ title: 'No se pudo quitar', description: error, variant: 'destructive' })
      return
    }
    onChanged()
    toast({
      title: `${bv.profile_name} ya no es corista aquí`,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const undoError = await addBackingVocal(supabase, privilege.id, bv.profile_id)
            if (undoError) toast({ title: 'No se pudo deshacer', description: undoError, variant: 'destructive' })
            onChanged()
          }}
        >
          <Undo2 className="w-4 h-4" />
          Deshacer
        </Button>
      ),
    })
  }

  if (vocals.length === 0 && !canJoin) return null

  return (
    <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
      <p className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
        <Mic2 className="w-3.5 h-3.5" aria-hidden="true" />
        Coristas ({vocals.length})
      </p>

      {vocals.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {vocals.map((bv) => {
            const canRemove = isOwner || isAdmin
            return (
              <li
                key={bv.id}
                className="inline-flex items-center gap-1 min-h-8 pl-2.5 pr-1 rounded-full bg-[var(--bg-raised)] border border-[var(--border-subtle)] text-xs font-medium"
              >
                <span className="truncate max-w-[10rem]">{bv.profile_name}</span>
                {bv.profile_id === user?.id && <span className="text-[var(--text-tertiary)]">(tú)</span>}
                {canRemove && bv.profile_id !== user?.id ? (
                  <button
                    type="button"
                    onClick={() => removeOther(bv)}
                    disabled={busy !== null}
                    className="touch-target sm:min-h-8 sm:min-w-8 -my-2 sm:my-0 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
                    aria-label={`Quitar a ${bv.profile_name} como corista`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="w-1.5" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canJoin && (
        <Button
          size="sm"
          variant="outline"
          fullWidthMobile
          loading={busy === 'join'}
          disabled={busy !== null}
          onClick={() => run('join', () => addBackingVocal(supabase, privilege.id, user!.id), 'Te uniste como corista')}
        >
          <Mic2 className="w-4 h-4" />
          Unirme como corista
        </Button>
      )}
      {mine && (
        <Button
          size="sm"
          variant="ghost"
          fullWidthMobile
          loading={busy === 'leave'}
          disabled={busy !== null}
          onClick={() => run('leave', () => removeBackingVocal(supabase, mine.id), 'Saliste como corista')}
        >
          <LogOut className="w-4 h-4" />
          Salir como corista
        </Button>
      )}
    </div>
  )
}
