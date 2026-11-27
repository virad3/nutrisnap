import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Salad } from 'lucide-react'
import { useAuth } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/Field'

function friendly(e: unknown) {
  const code = (e as { code?: string })?.code ?? ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Incorrect email or password.'
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.'
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.'
  if (code.includes('popup-closed')) return 'Sign-in was cancelled.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.'
  return 'Something went wrong. Please try again.'
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Salad className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function GoogleButton({ onError }: { onError: (m: string) => void }) {
  const { loginGoogle } = useAuth()
  const nav = useNavigate()
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={async () => {
        try {
          await loginGoogle()
          nav('/')
        } catch (e) {
          onError(friendly(e))
        }
      }}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
      </svg>
      Continue with Google
    </Button>
  )
}

const Divider = () => (
  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
    <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
  </div>
)

export function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(email, password)
      nav('/')
    } catch (x) {
      setErr(friendly(x))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Welcome back" subtitle="Log in to keep tracking your meals.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="text-right">
          <Link to="/forgot" className="text-sm font-medium text-primary">Forgot password?</Link>
        </div>
        {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
        <Button className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </Button>
      </form>
      <Divider />
      <GoogleButton onError={setErr} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link to="/register" className="font-semibold text-primary">Create an account</Link>
      </p>
    </Shell>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await register(email, password)
      nav('/onboarding')
    } catch (x) {
      setErr(friendly(x))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Create your account" subtitle="Snap meals, hit goals. It takes a minute.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <Input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
        <Button className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign up
        </Button>
      </form>
      <Divider />
      <GoogleButton onError={setErr} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-semibold text-primary">Log in</Link>
      </p>
    </Shell>
  )
}

export function ForgotPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setBusy(true)
    try {
      await resetPassword(email)
    } catch {
      /* Do not reveal whether the account exists. */
    } finally {
      setMsg('If an account exists for that email, a reset link is on its way.')
      setBusy(false)
    }
  }

  return (
    <Shell title="Reset password" subtitle="We'll email you a reset link.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {msg && <p className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">{msg}</p>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button className="w-full" disabled={busy}>Send reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-primary">Back to log in</Link>
      </p>
    </Shell>
  )
}
