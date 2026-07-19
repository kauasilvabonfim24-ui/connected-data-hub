import { useEffect, useState } from 'react'
import { Plus, Clock, Search, Pencil, Trash2, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import ServicoFormModal from '@/components/servicos/ServicoFormModal'
import toast from 'react-hot-toast'
import type { Servico } from '@/types/database'

export default function Servicos() {
  const { empresa } = useAuth()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)

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

  async function excluir(s: Servico) {
    if (!confirm(`Excluir o serviço "${s.nome}"?`)) return
    const { error } = await supabase.from('servicos').delete().eq('id', s.id)
    if (error) {
      toast.error('Não foi possível excluir o serviço.')
    } else {
      toast.success('Serviço excluído!')
      if (empresa?.id) void load(empresa.id)
    }
  }

  async function toggleAtivo(s: Servico) {
    const { error } = await supabase.from('servicos').update({ ativo: !s.ativo }).eq('id', s.id)
    if (error) {
      toast.error('Erro ao atualizar status.')
    } else {
      toast.success(s.ativo ? 'Serviço desativado' : 'Serviço ativado!')
      if (empresa?.id) void load(empresa.id)
    }
  }

  function abrirNovo() {
    setEditando(null)
    setModalOpen(true)
  }

  function abrirEdicao(s: Servico) {
    setEditando(s)
    setModalOpen(true)
  }

  const filtrados = servicos.filter((s) => s.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Serviços</h1>
          <p className="text-sm text-ink-muted">Catálogo de serviços que sua empresa oferece.</p>
        </div>
        <button className="btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo serviço</button>
      </div>

      <div className="mb-4 relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          className="input pl-9"
          placeholder="Buscar serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <EmptyState title={busca ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'} description="Cadastre os serviços que você oferece para usá-los em agendamentos e orçamentos automáticos." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((s) => (
            <div key={s.id} className={`card p-4 transition duration-200 hover:shadow-md ${!s.ativo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <p className="font-medium text-ink">{s.nome}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleAtivo(s)} title={s.ativo ? 'Desativar' : 'Ativar'} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface hover:text-ink">
                    <Power size={15} className={s.ativo ? 'text-ia-600' : 'text-ink-soft'} />
                  </button>
                  <button onClick={() => abrirEdicao(s)} title="Editar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface hover:text-ink">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => excluir(s)} title="Excluir" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {s.descricao && <p className="mt-1 text-xs text-ink-muted">{s.descricao}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                <span className="font-mono text-sm font-semibold text-ink">{formatCurrency(s.preco)}</span>
                <span className="flex items-center gap-1 text-xs text-ink-soft"><Clock size={13} /> {s.duracao_minutos} min</span>
              </div>
              {!s.ativo && <p className="mt-2 text-xs font-medium text-ink-soft">Inativo</p>}
            </div>
          ))}
        </div>
      )}

      <ServicoFormModal
        open={modalOpen}
        servico={editando}
        onClose={() => setModalOpen(false)}
        onSaved={() => empresa?.id && load(empresa.id)}
      />
    </div>
  )
}