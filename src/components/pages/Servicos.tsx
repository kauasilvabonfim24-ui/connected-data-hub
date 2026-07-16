import { useEffect, useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import type { Servico } from '@/types/database'

export default function Servicos() {
  const { empresa } = useAuth()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresa?.id) return
    void load(empresa.id)
  }, [empresa?.id])

  async function load(empresaId: string) {
    setLoading(true)
    const { data } = await supabase.from('servicos').select('*').eq('empresa_id', empresaId).order('nome')
    setServicos((data as Servico[]) ?? [])
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Serviços</h1>
          <p className="text-sm text-ink-muted">Catálogo de serviços que sua empresa oferece.</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Novo serviço</button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : servicos.length === 0 ? (
        <EmptyState title="Nenhum serviço cadastrado" description="Cadastre os serviços que você oferece para usá-los em agendamentos e orçamentos automáticos." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between">
                <p className="font-medium text-ink">{s.nome}</p>
                {!s.ativo && <span className="text-xs text-ink-soft">inativo</span>}
              </div>
              {s.descricao && <p className="mt-1 text-xs text-ink-muted">{s.descricao}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                <span className="font-mono text-sm font-semibold text-ink">{formatCurrency(s.preco)}</span>
                <span className="flex items-center gap-1 text-xs text-ink-soft"><Clock size={13} /> {s.duracao_minutos} min</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
