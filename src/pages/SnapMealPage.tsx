import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Camera, ImagePlus, Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { blobToBase64, blobToDataUrl, compressImage } from '@/lib/image'
import { sumItems } from '@/lib/nutrition'
import { round } from '@/lib/utils'
import { useAuth } from '@/store/authStore'
import { useData } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfidenceBadge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import type { AnalysisResult, FoodItem, MealType } from '@/types'

interface EditableItem extends FoodItem {
  basePortionG: number
  base: FoodItem
}

async function analyzeMeal(body: {
  imageBase64?: string
  mimeType?: string
  diet?: string
  text?: string
}): Promise<AnalysisResult> {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Please sign in again.')
  const res = await fetch('/api/analyze-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Analysis failed. Please try again.')
  return json as AnalysisResult
}

function guessMealType(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 19) return 'snack'
  return 'dinner'
}

const MAX_BYTES = 12 * 1024 * 1024

export function SnapMealPage() {
  const nav = useNavigate()
  const { user, profile } = useAuth()
  const { addMeal, date } = useData()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [blob, setBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [items, setItems] = useState<EditableItem[]>([])
  const [mealType, setMealType] = useState<MealType>(guessMealType())
  const [busy, setBusy] = useState<'idle' | 'analyzing' | 'saving'>('idle')
  const [err, setErr] = useState('')
  const [text, setText] = useState('')

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  async function onPick(file?: File) {
    if (!file) return
    setErr('')
    setAnalysis(null)
    setItems([])
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file.')
    if (file.size > MAX_BYTES) return setErr('That image is too large (max 12 MB).')
    try {
      const small = await compressImage(file)
      setBlob(small)
      setPreviewUrl(URL.createObjectURL(small))
    } catch {
      setErr('Could not read that image. Try another photo.')
    }
  }

  function reset() {
    setBlob(null)
    setPreviewUrl(null)
    setAnalysis(null)
    setItems([])
    setErr('')
    setText('')
  }

  async function analyze() {
    if (!blob && !text.trim()) return
    setErr('')
    setBusy('analyzing')
    try {
      const imageBase64 = blob ? await blobToBase64(blob) : undefined
      const data = await analyzeMeal({
        imageBase64,
        mimeType: blob ? 'image/jpeg' : undefined,
        text: text.trim() || undefined,
        diet: profile?.diet,
      })
      setAnalysis(data)
      setItems(data.items.map((i) => ({ ...i, basePortionG: i.portionG, base: i })))
    } catch (e) {
      const msg = (e as { message?: string })?.message
      setErr(msg && msg !== 'Failed to fetch' ? msg : 'Analysis failed. Check your connection and try again.')
    } finally {
      setBusy('idle')
    }
  }

  function setPortion(idx: number, grams: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const g = Math.max(1, Math.min(3000, grams || 1))
        const k = g / it.basePortionG
        return {
          ...it,
          portionG: g,
          calories: round(it.base.calories * k),
          proteinG: round(it.base.proteinG * k, 1),
          carbsG: round(it.base.carbsG * k, 1),
          fatG: round(it.base.fatG * k, 1),
          fiberG: it.base.fiberG == null ? null : round(it.base.fiberG * k, 1),
          sugarG: it.base.sugarG == null ? null : round(it.base.sugarG * k, 1),
        }
      }),
    )
  }

  const totals = sumItems(items)

  async function save() {
    if (!analysis || !items.length || !user) return
    setBusy('saving')
    setErr('')
    try {
      // Small thumbnail stored inline in Firestore (no Firebase Storage / billing needed).
      let photoUrl: string | null = null
      if (blob) {
        try {
          const thumb = await compressImage(new File([blob], 'meal.jpg', { type: 'image/jpeg' }), 360, 0.7)
          photoUrl = await blobToDataUrl(thumb)
        } catch {
          photoUrl = null // saving the meal matters more than the photo
        }
      }
      await addMeal({
        date,
        type: mealType,
        name: analysis.mealName,
        items: items.map(({ base: _b, basePortionG: _p, ...rest }) => rest),
        calories: round(totals.calories),
        proteinG: round(totals.proteinG, 1),
        carbsG: round(totals.carbsG, 1),
        fatG: round(totals.fatG, 1),
        fiberG: round(totals.fiberG, 1),
        sugarG: round(totals.sugarG, 1),
        photoUrl,
        source: 'ai',
      })
      nav('/', { replace: true })
    } catch {
      setErr('Could not save the meal. Please try again.')
      setBusy('idle')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Snap Your Meal</h1>
        <p className="text-sm text-muted-foreground">Take a photo, type what you ate, or both. AI estimates calories and macros.</p>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = '' }} />

      {!previewUrl ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Camera className="h-9 w-9" />
            </div>
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              Good light and a top-down view of the whole plate give the best estimates.
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <Button size="lg" onClick={() => cameraRef.current?.click()}><Camera className="h-5 w-5" /> Take photo</Button>
              <Button size="lg" variant="outline" onClick={() => galleryRef.current?.click()}><ImagePlus className="h-5 w-5" /> Upload from gallery</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative overflow-hidden rounded-2xl">
          <img src={previewUrl} alt="Your meal" className="max-h-80 w-full object-cover" />
          {busy === 'analyzing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium">Analyzing your meal…</span>
            </div>
          )}
          {busy === 'idle' && (
            <Button size="sm" variant="secondary" className="absolute right-3 top-3" onClick={reset}>
              <RefreshCw className="h-4 w-4" /> Retake
            </Button>
          )}
        </div>
      )}

      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-destructive" role="alert">{err}</p>}

      {!analysis && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="meal-text" className="text-sm font-medium">
              {blob ? 'Add details (optional)' : 'Or describe what you ate'}
            </label>
            <textarea
              id="meal-text"
              rows={3}
              maxLength={600}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 2 appam, vegetable stew, 1 boiled egg, black tea with sugar"
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              {blob ? 'Quantities you mention override the AI’s guess from the photo.' : 'Include quantities if you know them (grams, cups, pieces).'}
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={analyze} disabled={busy !== 'idle' || (!blob && !text.trim())}>
            {busy === 'analyzing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Analyze meal
          </Button>
        </div>
      )}

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{analysis.mealName}</CardTitle>
                <ConfidenceBadge level={analysis.overallConfidence} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tabular-nums">{round(totals.calories)} <span className="text-base font-medium text-muted-foreground">kcal</span></div>
              <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                <Mini l="Protein" v={`${round(totals.proteinG, 1)}g`} c="text-protein" />
                <Mini l="Carbs" v={`${round(totals.carbsG, 1)}g`} c="text-carbs" />
                <Mini l="Fat" v={`${round(totals.fatG, 1)}g`} c="text-fat" />
                <Mini l="Fiber" v={`${round(totals.fiberG, 1)}g`} />
                <Mini l="Sugar" v={`${round(totals.sugarG, 1)}g`} />
              </div>
            </CardContent>
          </Card>

          {analysis.uncertaintyNotes.length > 0 && (
            <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">AI is not fully sure</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {analysis.uncertaintyNotes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
                <p className="mt-2 text-xs">Adjust the portions below if they look off.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Detected items</h2>
            {items.map((it, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <ConfidenceBadge level={it.confidence} />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-right text-lg font-bold tabular-nums">{it.calories}<span className="text-xs font-normal text-muted-foreground"> kcal</span></div>
                      <Button size="icon" variant="ghost" aria-label={`Remove ${it.name}`} onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={10} max={Math.max(600, it.basePortionG * 3)} step={5} value={it.portionG}
                      onChange={(e) => setPortion(idx, Number(e.target.value))}
                      className="h-2 flex-1 accent-primary" aria-label={`${it.name} portion in grams`}
                    />
                    <div className="w-16 text-right text-sm font-semibold tabular-nums">{it.portionG} g</div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>P {it.proteinG}g</span><span>C {it.carbsG}g</span><span>F {it.fatG}g</span>
                    {it.fiberG != null && <span>Fiber {it.fiberG}g</span>}
                    {it.sugarG != null && <span>Sugar {it.sugarG}g</span>}
                  </div>
                  {it.note && <p className="text-xs italic text-muted-foreground">{it.note}</p>}
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground">All items removed. Retake or re-analyze.</p>}
          </div>

          <div className="space-y-3">
            <Select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} aria-label="Meal type">
              <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option><option value="snack">Snack</option>
            </Select>
            <Button size="lg" className="w-full" onClick={save} disabled={busy !== 'idle' || items.length === 0}>
              {busy === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />} Add to my log
            </Button>
            <p className="text-center text-xs text-muted-foreground">AI estimates can be off. Review before saving.</p>
          </div>
        </>
      )}
    </div>
  )
}

function Mini({ l, v, c }: { l: string; v: string; c?: string }) {
  return (
    <div className="rounded-xl bg-muted py-2">
      <div className={`font-bold ${c ?? ''}`}>{v}</div>
      <div className="text-muted-foreground">{l}</div>
    </div>
  )
}
