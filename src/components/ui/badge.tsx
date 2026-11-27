import { cn } from '@/lib/utils'
import type { Confidence } from '@/types'

const tone: Record<Confidence, string> = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
}

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', tone[level])}>
      {level} confidence
    </span>
  )
}
