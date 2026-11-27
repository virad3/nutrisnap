import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/store/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { NeedsOnboarding, Protected, PublicOnly } from '@/components/layout/Guards'
import { ForgotPage, LoginPage, RegisterPage } from '@/pages/AuthPages'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SnapMealPage } from '@/pages/SnapMealPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { ProfilePage } from '@/pages/ProfilePage'

export default function App() {
  const init = useAuth((s) => s.init)
  useEffect(() => init(), [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<ForgotPage />} />
        </Route>
        <Route element={<NeedsOnboarding />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route element={<Protected />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/snap" element={<SnapMealPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
