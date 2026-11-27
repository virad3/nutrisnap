import * as React from 'react'
import { cn } from '@/lib/utils'

const field =
  'flex h-11 w-full rounded-xl border border-input bg-card px-3.5 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => <input type={type} className={cn(field, className)} ref={ref} {...props} />,
)
Input.displayName = 'Input'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select className={cn(field, 'appearance-auto', className)} ref={ref} {...props} />,
)
Select.displayName = 'Select'
