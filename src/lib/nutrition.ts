import type { ActivityLevel, FoodItem, Goal, Profile, Targets } from '@/types'
import { round } from './utils'

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
}

type CalcInput = Pick<Profile, 'age' | 'gender' | 'heightCm' | 'weightKg' | 'bodyFatPct' | 'activity' | 'goal'>

/**
 * All outputs are ESTIMATES. Uses Mifflin-St Jeor, or Katch-McArdle when body fat % is provided.
 */
export function calculateTargets(p: CalcInput): Targets {
  const hm = p.heightCm / 100
  const bmi = p.weightKg / (hm * hm)

  let bmr: number
  if (p.bodyFatPct && p.bodyFatPct > 2 && p.bodyFatPct < 70) {
    const lbm = p.weightKg * (1 - p.bodyFatPct / 100)
    bmr = 370 + 21.6 * lbm
  } else {
    const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
    bmr = p.gender === 'male' ? base + 5 : p.gender === 'female' ? base - 161 : base - 78
  }
  const tdee = bmr * ACTIVITY_FACTORS[p.activity]

  const adj: Record<Goal, number> = { lose: 0.8, maintain: 1, gain: 1.1 }
  const floor = p.gender === 'male' ? 1500 : 1200
  const calories = Math.max(floor, tdee * adj[p.goal])

  const proteinG = p.weightKg * (p.goal === 'maintain' ? 1.6 : 2.0)
  const fatG = (calories * 0.27) / 9
  const carbsG = Math.max(0, (calories - proteinG * 4 - fatG * 9) / 4)

  return {
    bmi: round(bmi, 1),
    bmr: round(bmr),
    tdee: round(tdee),
    calories: round(calories),
    proteinG: round(proteinG),
    carbsG: round(carbsG),
    fatG: round(fatG),
  }
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy range'
  if (bmi < 30) return 'Overweight'
  return 'Obese range'
}

export function sumItems(items: FoodItem[]) {
  return items.reduce(
    (a, i) => ({
      calories: a.calories + i.calories,
      proteinG: a.proteinG + i.proteinG,
      carbsG: a.carbsG + i.carbsG,
      fatG: a.fatG + i.fatG,
      fiberG: a.fiberG + (i.fiberG ?? 0),
      sugarG: a.sugarG + (i.sugarG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0 },
  )
}

export const ESTIMATE_DISCLAIMER =
  'Calorie, macro and body-fat figures are estimates based on standard formulas and AI analysis. They are not medical advice.'
