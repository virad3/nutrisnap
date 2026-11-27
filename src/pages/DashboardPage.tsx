import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, isToday, parseISO, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Droplets, Flame, Minus, Plus, Trash2, Utensils } from 'lucide-react'
import { useAuth } from '@/store/authStore'
import { useData } from '@/store/dataStore'
import { CalorieRing } from '@/components/MacroRing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { MealType } from '@/types'

const TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
]

export function DashboardPage() {
  const { profile, targets } = useAuth()
  const { date, setDate, loadDay, meals, waterMl, addWater, deleteMeal, loading } = useData()

  useEffect(() => { loadDay(date).catch(() => undefined) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile || !targets) return null
  const d = parseISO(date)
  const shift = (n: number) => setDate(format(n > 0 ? addDays(d, n) : subDays(d, -n), 'yyyy-MM-dd'))

  const total = meals.reduce(
    (a, m) => ({ kcal: a.kcal + m.calories, p: a.p + m.proteinG, c: a.c + m.carbsG, f: a.f + m.fatG }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  )

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hi, {profile.name.split(' ')[0]} 👋</p>
          <h1 className="text-2xl font-bold">{isToday(d) ? 'Today' : format(d, 'EEE, d MMM')}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Previous day" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <Button size="icon" variant="ghost" aria-label="Next day" disabled={isToday(d)} onClick={() => shift(1)}><ChevronRight /></Button>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
          <CalorieRing eaten={total.kcal} target={targets.calories} />
          <div className="mt-2 flex justify-center gap-6 text-center text-sm">
            <div><div className="font-bold tabular-nums">{Math.round(total.kcal)}</div><div className="text-xs text-muted-foreground">eaten</div></div>
            <div><div className="font-bold tabular-nums">{targets.calories}</div><div className="text-xs text-muted-foreground">target</div></div>
          </div>
          <div className="mt-5 space-y-3">
            <Macro label="Protein" v={total.p} t={targets.proteinG} color="#6366f1" />
            <Macro label="Carbs" v={total.c} t={targets.carbsG} color="#f59e0b" />
            <Macro label="Fat" v={total.f} t={targets.fatG} color="#ec4899" />
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">Targets are estimates, not medical advice.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Droplets className="h-4 w-4 text-sky-500" /> Water</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-2xl font-bold tabular-nums">{(waterMl / 1000).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/ {(profile.waterTargetMl / 1000).toFixed(1)} L</span></span>
            <div className="flex gap-2">
              <Button size="icon" variant="secondary" aria-label="Remove 250 ml" onClick={() => addWater(-250)}><Minus className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => addWater(250)}><Plus className="h-4 w-4" /> 250 ml</Button>
            </div>
          </div>
          <Progress value={(waterMl / profile.waterTargetMl) * 100} color="#0ea5e9" />
        </CardContent>
      </Card>

      {TYPES.map((t) => {
        const list = meals.filter((m) => m.type === t.id)
        return (
          <section key={t.id}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.label}</h2>
              <span className="text-xs text-muted-foreground">{Math.round(list.reduce((s, m) => s + m.calories, 0))} kcal</span>
            </div>
            {list.length === 0 ? (
              <Link to="/snap" className="flex items-center gap-2 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                <Utensils className="h-4 w-4" /> Snap your {t.label.toLowerCase()}
              </Link>
            ) : (
              <div className="space-y-2">
                {list.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent"><Flame className="h-5 w-5 text-accent-foreground" /></div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground">P {m.proteinG}g · C {m.carbsG}g · F {m.fatG}g</div>
                      </div>
                      <div className="text-right font-bold tabular-nums">{Math.round(m.calories)}<div className="text-[10px] font-normal text-muted-foreground">kcal</div></div>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${m.name}`} onClick={() => deleteMeal(m.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )
      })}
      {loading && <p className="text-center text-xs text-muted-foreground">Loading…</p>}
    </div>
  )
}

function Macro({ label, v, t, color }: { label: string; v: number; t: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{Math.round(v)} / {t} g</span>
      </div>
      <Progress value={(v / t) * 100} color={color} />
    </div>
  )
}
