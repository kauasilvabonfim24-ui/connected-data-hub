import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import Dashboard from '@/pages/Dashboard'
import Agenda from '@/pages/Agenda'
import Clientes from '@/pages/Clientes'
import Financeiro from '@/pages/Financeiro'
import Servicos from '@/pages/Servicos'
import IAEmpresarial from '@/pages/IAEmpresarial'
import WhatsApp from '@/pages/WhatsApp'
import Marketing from '@/pages/Marketing'
import Notificacoes from '@/pages/Notificacoes'
import Configuracoes from '@/pages/Configuracoes'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-ink-muted">Carregando Servix IA...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="servicos" element={<Servicos />} />
        <Route path="ia-empresarial" element={<IAEmpresarial />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="notificacoes" element={<Notificacoes />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
