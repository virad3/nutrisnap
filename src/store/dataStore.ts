import { create } from 'zustand'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore'
import { format, subDays } from 'date-fns'
import { db } from '@/lib/firebase'
import { useAuth } from './authStore'
import type { Meal, WeightEntry } from '@/types'

export const todayStr = () => format(new Date(), 'yyyy-MM-dd')

function uid() {
  const u = useAuth.getState().user?.uid
  if (!u) throw new Error('Not signed in')
  return u
}

interface DataState {
  date: string
  meals: Meal[]
  waterMl: number
  weights: WeightEntry[]
  history: { date: string; calories: number; proteinG: number; carbsG: number; fatG: number }[]
  loading: boolean
  setDate: (d: string) => Promise<void>
  loadDay: (d?: string) => Promise<void>
  loadWeights: () => Promise<void>
  loadHistory: (days?: number) => Promise<void>
  addMeal: (m: Omit<Meal, 'id' | 'createdAt'>) => Promise<void>
  deleteMeal: (id: string) => Promise<void>
  addWater: (ml: number) => Promise<void>
  logWeight: (kg: number) => Promise<void>
}

export const useData = create<DataState>((set, get) => ({
  date: todayStr(),
  meals: [],
  waterMl: 0,
  weights: [],
  history: [],
  loading: false,

  setDate: async (d) => {
    set({ date: d })
    await get().loadDay(d)
  },

  loadDay: async (d) => {
    const date = d ?? get().date
    set({ loading: true })
    try {
      const u = uid()
      const mealSnap = await getDocs(query(collection(db, 'users', u, 'meals'), where('date', '==', date)))
      const meals = mealSnap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<Meal, 'id'>) }))
      meals.sort((a, b) => a.createdAt - b.createdAt)
      const waterSnap = await getDocs(query(collection(db, 'users', u, 'water'), where('date', '==', date)))
      set({ meals, waterMl: waterSnap.docs[0]?.data().ml ?? 0 })
    } finally {
      set({ loading: false })
    }
  },

  loadWeights: async () => {
    const snap = await getDocs(query(collection(db, 'users', uid(), 'weights'), orderBy('date', 'asc')))
    set({ weights: snap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<WeightEntry, 'id'>) })) })
  },

  loadHistory: async (days = 14) => {
    const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
    const snap = await getDocs(query(collection(db, 'users', uid(), 'meals'), where('date', '>=', from)))
    const byDay = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number }>()
    for (let i = days - 1; i >= 0; i--) {
      byDay.set(format(subDays(new Date(), i), 'yyyy-MM-dd'), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
    }
    snap.docs.forEach((d) => {
      const m = d.data() as Meal
      const t = byDay.get(m.date)
      if (!t) return
      t.calories += m.calories
      t.proteinG += m.proteinG
      t.carbsG += m.carbsG
      t.fatG += m.fatG
    })
    set({ history: [...byDay.entries()].map(([date, v]) => ({ date, ...v })) })
  },

  addMeal: async (m) => {
    const createdAt = Date.now()
    await addDoc(collection(db, 'users', uid(), 'meals'), { ...m, createdAt })
    await get().loadDay(get().date)
  },

  deleteMeal: async (id) => {
    await deleteDoc(doc(db, 'users', uid(), 'meals', id))
    set({ meals: get().meals.filter((m) => m.id !== id) })
  },

  addWater: async (ml) => {
    const date = get().date
    const next = Math.max(0, get().waterMl + ml)
    set({ waterMl: next })
    await setDoc(doc(db, 'users', uid(), 'water', date), { date, ml: next })
  },

  logWeight: async (kg) => {
    const date = todayStr()
    await setDoc(doc(db, 'users', uid(), 'weights', date), { date, weightKg: kg })
    await get().loadWeights()
  },
}))
