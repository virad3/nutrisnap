import { useMemo, useState, type FormEvent } from 'react'
import { Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/Field'
import { bmiCategory, calculateTargets, ESTIMATE_DISCLAIMER } from '@/lib/nutrition'
import type { ActivityLevel, DietPref, Gender, Goal, Profile } from '@/types'

const num = (v: string) => (v === '' ? NaN : Number(v))

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Profile | null
  submitLabel: string
  onSubmit: (p: Profile) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [age, setAge] = useState(initial?.age?.toString() ?? '')
  const [gender, setGender] = useState<Gender>(initial?.gender ?? 'male')
  const [height, setHeight] = useState(initial?.heightCm?.toString() ?? '')
  const [weight, setWeight] = useState(initial?.weightKg?.toString() ?? '')
  const [target, setTarget] = useState(initial?.targetWeightKg?.toString() ?? '')
  const [bf, setBf] = useState(initial?.bodyFatPct?.toString() ?? '')
  const [activity, setActivity] = useState<ActivityLevel>(initial?.activity ?? 'light')
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? 'lose')
  const [diet, setDiet] = useState<DietPref>(initial?.diet ?? 'kerala')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const valid =
    name.trim() &&
    num(age) >= 13 && num(age) <= 100 &&
    num(height) >= 100 && num(height) <= 250 &&
    num(weight) >= 30 && num(weight) <= 300 &&
    num(target) >= 30 && num(target) <= 300 &&
    (bf === '' || (num(bf) >= 3 && num(bf) <= 60))

  const preview = useMemo(() => {
    if (!valid) return null
    return calculateTargets({
      age: num(age), gender, heightCm: num(height), weightKg: num(weight),
      bodyFatPct: bf === '' ? null : num(bf), activity, goal,
    })
  }, [valid, age, gender, height, weight, bf, activity, goal])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return setErr('Please check your details: age 13–100, height 100–250 cm, weights 30–300 kg, body fat 3–60%.')
    setErr('')
    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(), age: num(age), gender, heightCm: num(height), weightKg: num(weight),
        targetWeightKg: num(target), bodyFatPct: bf === '' ? null : num(bf), activity, goal, diet,
        waterTargetMl: initial?.waterTargetMl ?? 2500, onboarded: true,
      })
    } catch (x) {
      console.error('Profile save failed', x)
      setErr(`Could not save: ${(x as Error)?.message ?? 'unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardHeader><CardTitle>About you</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age"><Input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></Field>
            <Field label="Gender">
              <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Body</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height (cm)"><Input type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
            <Field label="Weight (kg)"><Input type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
            <Field label="Target weight (kg)"><Input type="number" inputMode="decimal" step="0.1" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
            <Field label="Body fat % (optional)"><Input type="number" inputMode="decimal" step="0.1" value={bf} onChange={(e) => setBf(e.target.value)} /></Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lifestyle & goal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Activity level">
            <Select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
              <option value="sedentary">Sedentary (little exercise)</option>
              <option value="light">Lightly active (1–3 days/week)</option>
              <option value="moderate">Moderately active (3–5 days/week)</option>
              <option value="very">Very active (6–7 days/week)</option>
            </Select>
          </Field>
          <Field label="Fitness goal">
            <Select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
              <option value="lose">Lose fat</option><option value="maintain">Maintain weight</option><option value="gain">Gain muscle</option>
            </Select>
          </Field>
          <Field label="Preferred diet" hint="Helps the AI recognise dishes you commonly eat.">
            <Select value={diet} onChange={(e) => setDiet(e.target.value as DietPref)}>
              <option value="kerala">Kerala / South Indian</option><option value="indian">Indian</option>
              <option value="vegetarian">Vegetarian</option><option value="non-veg">Non-vegetarian</option><option value="other">Other</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {preview && (
        <Card className="border-primary/30 bg-accent/50">
          <CardHeader><CardTitle>Your estimated plan</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat l="BMI" v={`${preview.bmi} · ${bmiCategory(preview.bmi)}`} />
              <Stat l="BMR" v={`${preview.bmr} kcal`} />
              <Stat l="Maintenance (TDEE)" v={`${preview.tdee} kcal`} />
              <Stat l="Daily target" v={`${preview.calories} kcal`} strong />
              <Stat l="Protein" v={`${preview.proteinG} g`} />
              <Stat l="Carbs" v={`${preview.carbsG} g`} />
              <Stat l="Fat" v={`${preview.fatG} g`} />
            </div>
          </CardContent>
        </Card>
      )}

      <p className="flex gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" /> {ESTIMATE_DISCLAIMER}
      </p>
      {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
      <Button size="lg" className="w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
      </Button>
    </form>
  )
}

function Stat({ l, v, strong }: { l: string; v: string; strong?: boolean }) {
  return (
    <div className={strong ? 'col-span-2 rounded-xl bg-primary p-3 text-primary-foreground' : 'rounded-xl bg-card p-3'}>
      <div className={strong ? 'text-xs opacity-80' : 'text-xs text-muted-foreground'}>{l}</div>
      <div className={strong ? 'text-xl font-bold' : 'font-semibold'}>{v}</div>
    </div>
  )
}
