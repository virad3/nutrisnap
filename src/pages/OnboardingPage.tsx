import { useNavigate } from 'react-router-dom'
import { ProfileForm } from '@/components/ProfileForm'
import { useAuth } from '@/store/authStore'
import { useData } from '@/store/dataStore'

export function OnboardingPage() {
  const { user, saveProfile } = useAuth()
  const { logWeight } = useData()
  const nav = useNavigate()
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Let's set up your plan</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        A few details so we can estimate your daily calorie and macro targets.
      </p>
      <ProfileForm
        initial={user?.displayName ? ({ name: user.displayName } as never) : null}
        submitLabel="Start tracking"
        onSubmit={async (p) => {
          await saveProfile(p)
          void logWeight(p.weightKg).catch(() => undefined) // non-blocking
          nav('/', { replace: true })
        }}
      />
    </div>
  )
}
