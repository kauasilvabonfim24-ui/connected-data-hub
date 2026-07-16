import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber font-display text-xl font-bold text-brand">
            S
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Servix IA</h1>
          <p className="mt-1 text-sm text-brand-100">Seu funcionário digital 24 horas.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Entrar</h2>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>
          )}

          <label className="label" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            className="input mb-4"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label" htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            required
            className="input mb-6"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="mt-4 text-center text-sm text-ink-muted">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-brand hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
