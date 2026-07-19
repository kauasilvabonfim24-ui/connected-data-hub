import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import AgendaFormModal from '@/components/agenda/AgendaFormModal'
import type { Agendamento } from '@/types/database'

export default function Agenda() {
  const { empresa } = useAuth()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Agendamento | null>(null)

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

  function abrirNovo() {
    setEditando(null)
    setModalOpen(true)
  }

  function abrirEdicao(ag: Agendamento) {
    setEditando(ag)
    setModalOpen(true)
  }

  async function excluir(ag: Agendamento) {
    if (!confirm('Deseja realmente excluir este agendamento?')) return
    await supabase.from('agendamentos').delete().eq('id', ag.id)
    if (empresa?.id) void load(empresa.id)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Agenda</h1>
          <p className="text-sm text-ink-muted">Todos os agendamentos, confirmações e reagendamentos.</p>
        </div>
        <button className="btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo agendamento</button>
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
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((ag) => (
                <tr key={ag.id} className="border-b border-surface-border last:border-0 hover:bg-surface/35 transition">
                  <td className="px-5 py-3.5 font-medium text-ink">{ag.cliente?.nome ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{ag.servico?.nome ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatDate(ag.data_hora_inicio, true)}</td>
                  <td className="px-5 py-3.5 font-mono text-ink">{formatCurrency(ag.valor)}</td>
                  <td className="px-5 py-3.5"><Badge status={ag.status}>{ag.status.replace('_', ' ')}</Badge></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirEdicao(ag)} title="Editar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface hover:text-ink">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => excluir(ag)} title="Excluir" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AgendaFormModal
        open={modalOpen}
        agendamento={editando}
        onClose={() => setModalOpen(false)}
        onSaved={() => empresa?.id && load(empresa.id)}
      />
    </div>
  )
}