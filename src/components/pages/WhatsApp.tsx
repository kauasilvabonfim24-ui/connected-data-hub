import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, initials } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import type { WhatsappConversa, WhatsappMensagem } from '@/types/database'

export default function WhatsApp() {
  const { empresa } = useAuth()
  const [conversas, setConversas] = useState<WhatsappConversa[]>([])
  const [ativa, setAtiva] = useState<WhatsappConversa | null>(null)
  const [mensagens, setMensagens] = useState<WhatsappMensagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresa?.id) return
    void loadConversas(empresa.id)
  }, [empresa?.id])

  useEffect(() => {
    if (ativa) void loadMensagens(ativa.id)
  }, [ativa?.id])

  async function loadConversas(empresaId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('whatsapp_conversas')
      .select('*, cliente:clientes(*)')
      .eq('empresa_id', empresaId)
      .order('ultima_mensagem_em', { ascending: false })
    const lista = (data as WhatsappConversa[]) ?? []
    setConversas(lista)
    if (lista.length > 0) setAtiva(lista[0])
    setLoading(false)
  }

  async function loadMensagens(conversaId: string) {
    const { data } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('enviado_em', { ascending: true })
    setMensagens((data as WhatsappMensagem[]) ?? [])
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-ink">WhatsApp</h1>
        <p className="text-sm text-ink-muted">Conversas atendidas pela IA — assuma quando precisar.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : conversas.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={28} />}
          title="Nenhuma conversa ainda"
          description="Assim que o número do WhatsApp for conectado, as conversas atendidas pela IA aparecerão aqui."
        />
      ) : (
        <div className="card grid grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]" style={{ height: 'calc(100vh - 13rem)' }}>
          <div className="overflow-y-auto border-r border-surface-border">
            {conversas.map((c) => (
              <button
                key={c.id}
                onClick={() => setAtiva(c)}
                className={`flex w-full items-center gap-3 border-b border-surface-border px-4 py-3 text-left transition hover:bg-surface ${
                  ativa?.id === c.id ? 'bg-brand-50' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand">
                  {initials(c.cliente?.nome ?? c.numero_whatsapp)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.cliente?.nome ?? c.numero_whatsapp}</p>
                  <p className="truncate text-xs text-ink-soft">{c.numero_whatsapp}</p>
                </div>
                <Badge status={c.status}>{c.status.replace('_', ' ')}</Badge>
              </button>
            ))}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
              <p className="text-sm font-medium text-ink">{ativa?.cliente?.nome ?? ativa?.numero_whatsapp}</p>
              {ativa && <Badge status={ativa.status}>{ativa.status.replace('_', ' ')}</Badge>}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {mensagens.length === 0 && <p className="text-sm text-ink-soft">Nenhuma mensagem nessa conversa ainda.</p>}
              {mensagens.map((m) => (
                <div key={m.id} className={`flex ${m.remetente === 'cliente' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.remetente === 'cliente'
                        ? 'rounded-tl-sm bg-surface text-ink'
                        : m.remetente === 'ia'
                        ? 'rounded-tr-sm bg-ia-100/60 text-ink'
                        : 'rounded-tr-sm bg-brand text-white'
                    }`}
                  >
                    {m.conteudo}
                    <p className="mt-1 text-[10px] opacity-60">{formatDate(m.enviado_em, true)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
