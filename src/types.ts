export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very'
export type Goal = 'lose' | 'maintain' | 'gain'
export type DietPref = 'kerala' | 'indian' | 'vegetarian' | 'non-veg' | 'other'

export interface Profile {
  name: string
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  targetWeightKg: number
  bodyFatPct?: number | null
  activity: ActivityLevel
  goal: Goal
  diet: DietPref
  waterTargetMl: number
  onboarded: boolean
}

export interface Targets {
  bmi: number
  bmr: number
  tdee: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export type Confidence = 'high' | 'medium' | 'low'

export interface FoodItem {
  name: string
  portionG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number | null
  sugarG: number | null
  confidence: Confidence
  note?: string
}

export interface AnalysisResult {
  mealName: string
  items: FoodItem[]
  overallConfidence: Confidence
  uncertaintyNotes: string[]
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
  id: string
  date: string // yyyy-MM-dd
  type: MealType
  name: string
  items: FoodItem[]
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  photoUrl?: string | null
  source: 'ai' | 'manual'
  createdAt: number
}

export interface WeightEntry {
  id: string
  date: string
  weightKg: number
}
