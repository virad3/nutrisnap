import { cn } from '@/lib/utils'

export function Progress({ value, className, color }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
