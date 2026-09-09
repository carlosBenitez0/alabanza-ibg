'use client'

import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-sm font-medium text-neutral-700 dark:text-neutral-200',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'
export { Label }