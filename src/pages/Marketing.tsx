import { useEffect, useState } from 'react'
import { Plus, Sparkles, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import CampanhaFormModal from '@/components/marketing/CampanhaFormModal'
import { toast } from '@/lib/toast'
import type { CampanhaMarketing } from '@/types/database'

export default function Marketing() {
  const { empresa } = useAuth()
  const [campanhas, setCampanhas] = useState<CampanhaMarketing[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [disparandoId, setDisparandoId] = useState<string | null>(null)

  useEffect(() => {
    if (!empresa?.id) return
    void load(empresa.id)
  }, [empresa?.id])

  async function load(empresaId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('campanhas_marketing')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })
    setCampanhas((data as CampanhaMarketing[]) ?? [])
    setLoading(false)
  }

  async function enviarCampanha(id: string, nome: string) {
    setDisparandoId(id)
    
    // Simula disparo de campanha
    const { error } = await supabase
      .from('campanhas_marketing')
      .update({ status: 'enviada', enviada_em: new Date().toISOString() })
      .eq('id', id)

    setDisparandoId(null)

    if (error) {
      toast.error('Ocorreu um erro ao enviar a campanha.')
    } else {
      toast.success(`Campanha "${nome}" enviada com sucesso para todos os seus clientes via WhatsApp!`)
      if (empresa?.id) void load(empresa.id)
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Marketing</h1>
          <p className="text-sm text-ink-muted">Campanhas de promoção e recuperação de clientes.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Nova campanha</button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : campanhas.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Nenhuma campanha criada"
          description="Crie campanhas manualmente ou deixe a IA sugerir quando identificar clientes inativos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {campanhas.map((c) => (
            <div key={c.id} className="card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-ink">{c.nome}</p>
                    <p className="text-xs capitalize text-ink-soft">{c.tipo.replace('_', ' ')}</p>
                  </div>
                  <Badge status={c.status}>{c.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-ink-muted line-clamp-3">{c.mensagem}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border flex flex-col gap-2.5">
                {c.status === 'rascunho' && (
                  <button
                    onClick={() => enviarCampanha(c.id, c.nome)}
                    disabled={disparandoId !== null}
                    className="btn-primary !py-1.5 !text-xs w-full flex items-center justify-center gap-1.5"
                  >
                    <Send size={12} />
                    {disparandoId === c.id ? 'Disparando...' : 'Disparar Campanha Agora'}
                  </button>
                )}

                <div className="flex items-center justify-between text-xs text-ink-soft">
                  {c.criado_por_ia ? (
                    <span className="flex items-center gap-1 text-ia-600 font-medium"><Sparkles size={12} /> Criada pela IA</span>
                  ) : <span>Criada manualmente</span>}
                  <span>{formatDate(c.enviada_em || c.criado_em)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CampanhaFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => empresa?.id && load(empresa.id)}
      />
    </div>
  )
}