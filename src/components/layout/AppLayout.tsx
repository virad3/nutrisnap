import { NavLink, Outlet } from 'react-router-dom'
import { Camera, Home, LineChart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tab = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground',
  )

export function AppLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <main className="px-4 pb-32 pt-6">
        <Outlet />
      </main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-end px-2">
          <NavLink to="/" end className={tab}>
            <Home className="h-5 w-5" />
            Today
          </NavLink>
          <NavLink to="/progress" className={tab}>
            <LineChart className="h-5 w-5" />
            Progress
          </NavLink>
          <NavLink to="/snap" className="-mt-6 flex flex-1 flex-col items-center gap-0.5 pb-2 text-[11px] font-semibold text-primary">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
              <Camera className="h-6 w-6" />
            </span>
            Snap
          </NavLink>
          <NavLink to="/profile" className={tab}>
            <User className="h-5 w-5" />
            Profile
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
