'use client'

import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'
export { Label }