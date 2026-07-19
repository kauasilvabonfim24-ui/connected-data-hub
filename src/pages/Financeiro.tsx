import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import FinanceiroFormModal from '@/components/financeiro/FinanceiroFormModal'
import type { FinanceiroTransacao } from '@/types/database'

export default function Financeiro() {
  const { empresa } = useAuth()
  const [transacoes, setTransacoes] = useState<FinanceiroTransacao[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!empresa?.id) return
    void load(empresa.id)
  }, [empresa?.id])

  async function load(empresaId: string) {
    setLoading(true)
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    const { data } = await supabase
      .from('financeiro_transacoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('data_transacao', primeiroDiaMes.toISOString().slice(0, 10))
      .order('data_transacao', { ascending: false })
    setTransacoes((data as FinanceiroTransacao[]) ?? [])
    setLoading(false)
  }

  const receitas = transacoes.filter((t) => t.tipo === 'receita' && t.status === 'pago').reduce((s, t) => s + Number(t.valor), 0)
  const despesas = transacoes.filter((t) => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + Number(t.valor), 0)
  const aReceber = transacoes.filter((t) => t.tipo === 'receita' && t.status === 'pendente').reduce((s, t) => s + Number(t.valor), 0)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Financeiro</h1>
          <p className="text-sm text-ink-muted">Receitas, despesas e recebimentos do mês.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Novo lançamento</button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Recebido no mês" value={formatCurrency(receitas)} icon={<TrendingUp size={18} />} accent="amber" />
        <StatCard label="Despesas no mês" value={formatCurrency(despesas)} icon={<TrendingDown size={18} />} accent="brand" />
        <StatCard label="A receber" value={formatCurrency(aReceber)} icon={<Wallet size={18} />} accent="ia" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Carregando...</p>
        ) : transacoes.length === 0 ? (
          <div className="p-2"><EmptyState title="Nenhuma movimentação este mês" description="Lançamentos manuais e recebimentos via PIX/cartão aparecerão aqui." /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border bg-surface/60 text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-5 py-3 font-medium">Descrição</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transacoes.map((t) => (
                <tr key={t.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3.5 font-medium text-ink">{t.descricao ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{t.categoria ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{formatDate(t.data_transacao)}</td>
                  <td className={`px-5 py-3.5 font-mono ${t.tipo === 'receita' ? 'text-ia-600' : 'text-rose-600'}`}>
                    {t.tipo === 'despesa' ? '-' : '+'} {formatCurrency(t.valor)}
                  </td>
                  <td className="px-5 py-3.5"><Badge status={t.status}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FinanceiroFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => empresa?.id && load(empresa.id)}
      />
    </div>
  )
}