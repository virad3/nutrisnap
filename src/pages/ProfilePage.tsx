import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { ProfileForm } from '@/components/ProfileForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/store/authStore'

export function ProfilePage() {
  const { profile, user, saveProfile, logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [water, setWater] = useState(String(profile?.waterTargetMl ?? 2500))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>
      {saved && <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">Saved. Your targets were recalculated.</p>}
      <ProfileForm
        initial={profile ? { ...profile, waterTargetMl: Number(water) || 2500 } : null}
        submitLabel="Save changes"
        onSubmit={async (p) => {
          await saveProfile({ ...p, waterTargetMl: Math.min(8000, Math.max(500, Number(water) || 2500)) })
          setSaved(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
      <Card>
        <CardContent className="space-y-2 pt-5">
          <label className="text-sm font-medium">Daily water goal (ml)</label>
          <Input type="number" inputMode="numeric" value={water} onChange={(e) => setWater(e.target.value)} />
          <p className="text-xs text-muted-foreground">Applied when you save changes above.</p>
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={logout}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  )
}
