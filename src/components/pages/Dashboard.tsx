import { useEffect, useState } from 'react'
import { Wallet, Calendar, Users, UserX, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, greeting } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import type { Agendamento, IaSugestao } from '@/types/database'

export default function Dashboard() {
  const { empresa, usuario } = useAuth()
  const [loading, setLoading] = useState(true)
  const [faturamentoHoje, setFaturamentoHoje] = useState(0)
  const [servicosHoje, setServicosHoje] = useState<Agendamento[]>([])
  const [totalClientes, setTotalClientes] = useState(0)
  const [clientesInativos, setClientesInativos] = useState(0)
  const [sugestoes, setSugestoes] = useState<IaSugestao[]>([])

  useEffect(() => {
    if (!empresa?.id) return
    void loadDashboard(empresa.id)
  }, [empresa?.id])

  async function loadDashboard(empresaId: string) {
    setLoading(true)
    const hojeInicio = new Date(); hojeInicio.setHours(0, 0, 0, 0)
    const hojeFim = new Date(); hojeFim.setHours(23, 59, 59, 999)

    const [agendaRes, transacoesRes, clientesRes] = await Promise.all([
      supabase
        .from('agendamentos')
        .select('*, cliente:clientes(*), servico:servicos(*)')
        .eq('empresa_id', empresaId)
        .gte('data_hora_inicio', hojeInicio.toISOString())
        .lte('data_hora_inicio', hojeFim.toISOString())
        .order('data_hora_inicio', { ascending: true }),
      supabase
        .from('financeiro_transacoes')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .gte('data_transacao', hojeInicio.toISOString().slice(0, 10)),
      supabase.from('clientes').select('id, ultima_compra_em').eq('empresa_id', empresaId)
    ])

    setServicosHoje((agendaRes.data as Agendamento[]) ?? [])
    setFaturamentoHoje((transacoesRes.data ?? []).reduce((sum, t) => sum + Number(t.valor), 0))

    const clientes = clientesRes.data ?? []
    setTotalClientes(clientes.length)
    const noventaDiasAtras = Date.now() - 90 * 24 * 60 * 60 * 1000
    setClientesInativos(
      clientes.filter((c) => !c.ultima_compra_em || new Date(c.ultima_compra_em).getTime() < noventaDiasAtras).length
    )

    const { data: sugestoesData } = await supabase
      .from('ia_sugestoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false })
      .limit(3)
    setSugestoes((sugestoesData as IaSugestao[]) ?? [])

    setLoading(false)
  }

  async function responderSugestao(id: string, status: 'aceita' | 'recusada') {
    await supabase.from('ia_sugestoes').update({ status, respondida_em: new Date().toISOString() }).eq('id', id)
    setSugestoes((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Faixa de fala da IA — reforça o "funcionário digital" falando com o dono */}
      <div className="card flex items-start gap-3 border-ia-100 bg-gradient-to-r from-ia-100/50 to-white p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ia text-white">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">
            {greeting()}, {usuario?.nome?.split(' ')[0] ?? ''}. Hoje você tem{' '}
            <strong>{servicosHoje.length} serviço{servicosHoje.length === 1 ? '' : 's'} agendado{servicosHoje.length === 1 ? '' : 's'}</strong>{' '}
            e um faturamento de <strong>{formatCurrency(faturamentoHoje)}</strong> até agora.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento hoje" value={formatCurrency(faturamentoHoje)} icon={<Wallet size={18} />} accent="amber" />
        <StatCard label="Serviços hoje" value={String(servicosHoje.length)} icon={<Calendar size={18} />} accent="brand" />
        <StatCard label="Total de clientes" value={String(totalClientes)} icon={<Users size={18} />} accent="ia" />
        <StatCard label="Clientes inativos (90d+)" value={String(clientesInativos)} icon={<UserX size={18} />} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-ink">Agenda de hoje</h3>
          <div className="mt-4 space-y-2">
            {loading && <p className="text-sm text-ink-muted">Carregando...</p>}
            {!loading && servicosHoje.length === 0 && (
              <EmptyState title="Nenhum serviço agendado para hoje" description="Os próximos agendamentos aparecerão aqui." />
            )}
            {servicosHoje.map((ag) => (
              <div key={ag.id} className="flex items-center justify-between rounded-xl border border-surface-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{ag.cliente?.nome ?? 'Cliente'}</p>
                  <p className="text-xs text-ink-muted">{ag.servico?.nome ?? 'Serviço'} · {formatDate(ag.data_hora_inicio, true)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-ink">{formatCurrency(ag.valor)}</span>
                  <Badge status={ag.status}>{ag.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-ia" />
            <h3 className="font-display text-base font-semibold text-ink">Sugestões da IA</h3>
          </div>
          <p className="mb-4 text-xs text-ink-muted">Ações que o Servix IA identificou pra você.</p>
          <div className="space-y-3">
            {sugestoes.length === 0 && (
              <p className="text-sm text-ink-soft">Nenhuma sugestão no momento. A IA está de olho.</p>
            )}
            {sugestoes.map((s) => (
              <div key={s.id} className="rounded-xl border border-ia-100 bg-ia-100/30 p-3.5">
                <p className="text-sm font-medium text-ink">{s.titulo}</p>
                <p className="mt-1 text-xs text-ink-muted">{s.descricao}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => responderSugestao(s.id, 'aceita')} className="btn-primary flex-1 !py-1.5 !text-xs">Sim</button>
                  <button onClick={() => responderSugestao(s.id, 'recusada')} className="btn-secondary flex-1 !py-1.5 !text-xs">Não</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
