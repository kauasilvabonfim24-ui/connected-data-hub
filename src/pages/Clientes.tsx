import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, initials } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Cliente } from '@/types/database'

export default function Clientes() {
  const { empresa } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresa?.id) return
    void load(empresa.id)
  }, [empresa?.id])

  async function load(empresaId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })
    setClientes((data as Cliente[]) ?? [])
    setLoading(false)
  }

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.telefone.includes(busca)
  )

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Clientes</h1>
          <p className="text-sm text-ink-muted">Seu CRM — histórico, gastos e frequência de cada cliente.</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Novo cliente</button>
      </div>

      <div className="mb-4 relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" description="Cadastre clientes manualmente ou eles serão criados automaticamente pelo atendimento no WhatsApp." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
                  {initials(c.nome)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{c.nome}</p>
                  <p className="text-xs text-ink-soft">{c.telefone}</p>
                </div>
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-surface-border pt-3.5 text-xs">
                <div>
                  <p className="text-ink-soft">Total gasto</p>
                  <p className="font-mono font-medium text-ink">{formatCurrency(c.total_gasto)}</p>
                </div>
                <div>
                  <p className="text-ink-soft">Serviços</p>
                  <p className="font-mono font-medium text-ink">{c.total_servicos}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-ink-soft">Última compra</p>
                  <p className="font-medium text-ink">{c.ultima_compra_em ? formatDate(c.ultima_compra_em) : 'Nunca'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
