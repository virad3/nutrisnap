export function CalorieRing({ eaten, target }: { eaten: number; target: number }) {
  const r = 70
  const c = 2 * Math.PI * r
  const pct = Math.min(1, target ? eaten / target : 0)
  const over = eaten > target
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={over ? '#ef4444' : 'hsl(var(--primary))'}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{Math.round(Math.abs(target - eaten))}</span>
        <span className="text-xs text-muted-foreground">{over ? 'kcal over' : 'kcal left'}</span>
      </div>
    </div>
  )
}
