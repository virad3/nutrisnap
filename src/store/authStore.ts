import { create } from 'zustand'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { calculateTargets } from '@/lib/nutrition'
import type { Profile, Targets } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  targets: Targets | null
  ready: boolean
  init: () => () => void
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  saveProfile: (p: Profile) => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  targets: null,
  ready: false,

  init: () =>
    onAuthStateChanged(auth, async (user) => {
      if (!user) return set({ user: null, profile: null, targets: null, ready: true })
      set({ user })
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const profile = snap.exists() ? (snap.data() as Profile) : null
        set({ profile, targets: profile ? calculateTargets(profile) : null, ready: true })
      } catch {
        set({ profile: null, targets: null, ready: true })
      }
    }),

  register: async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password)
  },
  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
  },
  loginGoogle: async () => {
    await signInWithPopup(auth, googleProvider)
  },
  logout: async () => {
    await signOut(auth)
  },
  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email)
  },

  saveProfile: async (p) => {
    const uid = get().user?.uid
    if (!uid) throw new Error('Not signed in')
    const clean: Profile = { ...p, bodyFatPct: p.bodyFatPct ?? null, onboarded: true }
    // Firestore writes wait for server confirmation and hang silently when the DB is unreachable,
    // so fail loudly after 15 s instead of spinning forever.
    await Promise.race([
      setDoc(doc(db, 'users', uid), clean, { merge: true }),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('Could not reach the database. Is Firestore running / enabled?')), 15000),
      ),
    ])
    set({ profile: clean, targets: calculateTargets(clean) })
  },
}))
