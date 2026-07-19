import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, initials } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import ClienteFormModal from '@/components/clientes/ClienteFormModal'
import toast from 'react-hot-toast'
import type { Cliente } from '@/types/database'

export default function Clientes() {
  const { empresa } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)

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

  async function excluir(c: Cliente) {
    if (!confirm(`Deseja excluir o cliente "${c.nome}"?`)) return
    const { error } = await supabase.from('clientes').delete().eq('id', c.id)
    if (error) {
      toast.error('Erro ao excluir cliente. Verifique se ele possui agendamentos ativos.')
    } else {
      toast.success('Cliente excluído com sucesso!')
      if (empresa?.id) void load(empresa.id)
    }
  }

  function abrirNovo() {
    setEditando(null)
    setModalOpen(true)
  }

  function abrirEdicao(c: Cliente) {
    setEditando(c)
    setModalOpen(true)
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
        <button className="btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo cliente</button>
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
            <div key={c.id} className="card p-4 flex flex-col justify-between transition duration-200 hover:shadow-md">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
                      {initials(c.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{c.nome}</p>
                      <p className="text-xs text-ink-soft">{c.telefone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => abrirEdicao(c)} title="Editar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface hover:text-ink">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => excluir(c)} title="Excluir" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
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

      <ClienteFormModal
        open={modalOpen}
        cliente={editando}
        onClose={() => setModalOpen(false)}
        onSaved={() => empresa?.id && load(empresa.id)}
      />
    </div>
  )
}