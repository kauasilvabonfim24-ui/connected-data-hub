import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import type { Agendamento } from '@/types/database'

export default function Agenda() {
  const { empresa } = useAuth()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresa?.id) return
    void load(empresa.id)
  }, [empresa?.id])

  async function load(empresaId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(*), servico:servicos(*)')
      .eq('empresa_id', empresaId)
      .order('data_hora_inicio', { ascending: true })
    setAgendamentos((data as Agendamento[]) ?? [])
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Agenda</h1>
          <p className="text-sm text-ink-muted">Todos os agendamentos, confirmações e reagendamentos.</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Novo agendamento</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <div className="p-2">
            <EmptyState title="Nenhum agendamento ainda" description="Crie seu primeiro agendamento ou aguarde os agendamentos vindos do WhatsApp." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border bg-surface/60 text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Serviço</th>
                <th className="px-5 py-3 font-medium">Data e hora</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((ag) => (
                <tr key={ag.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3.5 font-medium text-ink">{ag.cliente?.nome ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{ag.servico?.nome ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatDate(ag.data_hora_inicio, true)}</td>
                  <td className="px-5 py-3.5 font-mono text-ink">{formatCurrency(ag.valor)}</td>
                  <td className="px-5 py-3.5"><Badge status={ag.status}>{ag.status.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
