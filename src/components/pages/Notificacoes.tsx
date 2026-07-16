import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Notificacao } from '@/types/database'

export default function Notificacoes() {
  const { empresa } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresa?.id) return
    void load(empresa.id)
  }, [empresa?.id])

  async function load(empresaId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })
      .limit(50)
    setNotificacoes((data as Notificacao[]) ?? [])
    setLoading(false)
  }

  async function marcarComoLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-ink">Notificações</h1>
        <p className="text-sm text-ink-muted">Tudo o que aconteceu no seu negócio.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : notificacoes.length === 0 ? (
        <EmptyState icon={<Bell size={28} />} title="Nenhuma notificação" description="Novos agendamentos, pagamentos e avaliações aparecerão aqui." />
      ) : (
        <div className="card divide-y divide-surface-border overflow-hidden">
          {notificacoes.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.lida && marcarComoLida(n.id)}
              className={`flex w-full items-start justify-between px-5 py-3.5 text-left transition hover:bg-surface ${
                !n.lida ? 'bg-brand-50/40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.lida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber" />}
                <div className={!n.lida ? '' : 'pl-5'}>
                  <p className="text-sm font-medium text-ink">{n.titulo}</p>
                  {n.mensagem && <p className="text-xs text-ink-muted">{n.mensagem}</p>}
                </div>
              </div>
              <span className="shrink-0 text-xs text-ink-soft">{formatDate(n.criado_em, true)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
