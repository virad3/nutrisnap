import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/store/authStore'
import { useData } from '@/store/dataStore'
import { bmiCategory } from '@/lib/nutrition'

export function ProgressPage() {
  const { profile, targets } = useAuth()
  const { weights, history, loadWeights, loadHistory, logWeight } = useData()
  const [w, setW] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadWeights().catch(() => undefined)
    loadHistory(14).catch(() => undefined)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile || !targets) return null
  const latest = weights.at(-1)?.weightKg ?? profile.weightKg
  const start = weights[0]?.weightKg ?? profile.weightKg
  const total = Math.abs(profile.targetWeightKg - start)
  const done = Math.abs(latest - start)
  const toward = (profile.targetWeightKg - start) * (latest - start) >= 0
  const pct = total === 0 ? 100 : toward ? Math.min(100, (done / total) * 100) : 0
  const heightM = profile.heightCm / 100
  const bmi = Math.round((latest / (heightM * heightM)) * 10) / 10

  const wData = weights.map((x) => ({ d: format(parseISO(x.date), 'd MMM'), kg: x.weightKg }))
  const cData = history.map((x) => ({ d: format(parseISO(x.date), 'd'), kcal: Math.round(x.calories) }))
  const logged = history.filter((h) => h.calories > 0)
  const avg = logged.length ? Math.round(logged.reduce((s, h) => s + h.calories, 0) / logged.length) : 0

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Progress</h1>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Current weight</div>
              <div className="text-3xl font-bold tabular-nums">{latest} <span className="text-base font-normal">kg</span></div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Goal {profile.targetWeightKg} kg<br />BMI {bmi} · {bmiCategory(bmi)}
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{Math.round(pct)}% of the way to your target</p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              const kg = Number(w)
              if (!(kg >= 30 && kg <= 300)) return
              setBusy(true)
              try { await logWeight(kg); setW('') } finally { setBusy(false) }
            }}
          >
            <Input type="number" inputMode="decimal" step="0.1" placeholder="Log today's weight (kg)" value={w} onChange={(e) => setW(e.target.value)} />
            <Button disabled={busy || !w}>Log</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Weight trend</CardTitle></CardHeader>
        <CardContent className="h-56">
          {wData.length < 2 ? (
            <p className="pt-16 text-center text-sm text-muted-foreground">Log your weight on a few days to see a trend.</p>
          ) : (
            <ResponsiveContainer>
              <LineChart data={wData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" fontSize={11} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} fontSize={11} width={32} tickLine={false} />
                <Tooltip />
                <ReferenceLine y={profile.targetWeightKg} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="kg" stroke="hsl(160 84% 39%)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calories, last 14 days</CardTitle>
          <p className="text-xs text-muted-foreground">Average on logged days: {avg} kcal · target {targets.calories}</p>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer>
            <BarChart data={cData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" fontSize={11} tickLine={false} />
              <YAxis fontSize={11} width={36} tickLine={false} />
              <Tooltip />
              <ReferenceLine y={targets.calories} stroke="#f59e0b" strokeDasharray="4 4" />
              <Bar dataKey="kcal" fill="hsl(160 84% 39%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
