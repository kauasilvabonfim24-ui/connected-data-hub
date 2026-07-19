import { useEffect, useState, useRef } from 'react'
import { MessageCircle, Send, Sparkles, Check, Power, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, initials } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { toast } from '@/lib/toast'
import type { WhatsappConversa, WhatsappMensagem } from '@/types/database'

type FiltroStatus = 'todas' | 'aberta' | 'aguardando_humano' | 'fechada'

export default function WhatsApp() {
  const { empresa } = useAuth()
  const [conversas, setConversas] = useState<WhatsappConversa[]>([])
  const [ativa, setAtiva] = useState<WhatsappConversa | null>(null)
  const [mensagens, setMensagens] = useState<WhatsappMensagem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Custom Controls State
  const [filtro, setFiltro] = useState<FiltroStatus>('todas')
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [simuladorAberto, setSimuladorAberto] = useState(false)
  const [msgSimulada, setMsgSimulada] = useState('')
  const [simulando, setSimulando] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!empresa?.id) return
    void loadConversas(empresa.id)
  }, [empresa?.id])

  useEffect(() => {
    if (ativa) {
      void loadMensagens(ativa.id)
    }
  }, [ativa?.id])

  // Subscribe to real-time changes in conversation and message lists
  useEffect(() => {
    if (!empresa?.id) return

    const channel = supabase
      .channel('whatsapp-realtime-production')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversas',
          filter: `empresa_id=eq.${empresa.id}`
        },
        () => {
          // Instantly refresh list of active conversations
          void loadConversas(empresa.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_mensagens'
        },
        async (payload) => {
          const novaMsg = payload.new as WhatsappMensagem
          // If the message belongs to the current open chat, reload the messaging feed
          if (ativa && novaMsg.conversa_id === ativa.id) {
            await loadMensagens(ativa.id)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [empresa?.id, ativa?.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function loadConversas(empresaId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('whatsapp_conversas')
      .select('*, cliente:clientes(*)')
      .eq('empresa_id', empresaId)
      .order('ultima_mensagem_em', { ascending: false })
    const lista = (data as WhatsappConversa[]) ?? []
    setConversas(lista)
    
    // Select first conversation if none selected
    if (lista.length > 0) {
      if (!ativa || !lista.some(c => c.id === ativa.id)) {
        setAtiva(lista[0])
      } else {
        // Keep selected conversation up-to-date with DB changes
        const atual = lista.find(c => c.id === ativa.id)
        if (atual) setAtiva(atual)
      }
    } else {
      setAtiva(null)
    }
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

  // Envia mensagem como atendente (humano)
  async function enviarResposta(e: React.FormEvent) {
    e.preventDefault()
    if (!novaMensagem.trim() || !ativa || !empresa?.id) return

    setEnviando(true)
    const texto = novaMensagem.trim()
    setNovaMensagem('')

    try {
      // 1. Insere mensagem do atendente
      await supabase.from('whatsapp_mensagens').insert({
        conversa_id: ativa.id,
        remetente: 'atendente',
        tipo: 'texto',
        conteudo: texto
      })

      // 2. Coloca conversa como 'aguardando_humano'
      await supabase
        .from('whatsapp_conversas')
        .update({
          status: 'aguardando_humano',
          ultima_mensagem_em: new Date().toISOString()
        })
        .eq('id', ativa.id)

      toast.success('Mensagem enviada como atendente. IA pausada temporariamente.')

      // 3. Atualiza localmente
      await loadMensagens(ativa.id)
      await loadConversas(empresa.id)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar mensagem.')
    } finally {
      setEnviando(false)
    }
  }

  // Alterna o controle da IA (Ativa IA ou Pausa para humano)
  async function alterarStatus(novoStatus: WhatsappConversa['status']) {
    if (!ativa || !empresa?.id) return
    
    const { error } = await supabase
      .from('whatsapp_conversas')
      .update({ status: novoStatus })
      .eq('id', ativa.id)

    if (error) {
      toast.error('Erro ao alterar controle da conversa.')
    } else {
      if (novoStatus === 'aberta') {
        toast.success('Servix IA reativada para automatizar o atendimento deste cliente!')
      } else if (novoStatus === 'fechada') {
        toast.success('Conversa marcada como resolvida e concluída!')
      } else {
        toast.success('Conversa colocada sob controle de operador humano.')
      }
      await loadConversas(empresa.id)
    }
  }

  // Simula o recebimento de uma mensagem do cliente no WhatsApp
  async function enviarSimulacao(e: React.FormEvent) {
    e.preventDefault()
    if (!msgSimulada.trim() || !ativa || !empresa?.id) return

    setSimulando(true)
    const texto = msgSimulada.trim()
    setMsgSimulada('')
    setSimuladorAberto(false)

    try {
      // Chamada da IA Central usando o cliente do Supabase invoke()
      const { data, error } = await supabase.functions.invoke('ia-central', {
        body: {
          empresa_id: empresa.id,
          telefone: ativa.numero_whatsapp,
          nome_contato: ativa.cliente?.nome || ativa.numero_whatsapp,
          mensagem: texto
        }
      })

      if (error) {
        console.warn('Falha ao chamar a Edge function, aplicando fallback de simulação local no banco:', error)
        
        // Simulação local no banco (Fallback do fluxo)
        // 1. Insere a mensagem simulada do cliente
        await supabase.from('whatsapp_mensagens').insert({
          conversa_id: ativa.id,
          remetente: 'cliente',
          tipo: 'texto',
          conteudo: texto
        })

        // 2. Se a conversa for 'aberta', gera uma resposta local simulada do robô
        if (ativa.status === 'aberta' || ativa.status === 'fechada') {
          const txt = texto.toLowerCase()
          let respostaRobo = `Olá! Sou o assistente automático da empresa. No momento recebemos sua mensagem e já estamos analisando.`
          
          if (txt.includes('preço') || txt.includes('quanto') || txt.includes('valor')) {
            respostaRobo = `Nossos serviços e preços principais são:\n• Consulta Geral - R$ 150,00\n• Atendimento Emergencial - R$ 250,00\n• Manutenção Corretiva - A partir de R$ 120,00.\n\nQuer agendar agora?`
          } else if (txt.includes('agendar') || txt.includes('horário') || txt.includes('marcar')) {
            respostaRobo = `Temos horários disponíveis para hoje às 14:00 e amanhã às 09:00. Qual o melhor horário para você?`
          } else if (txt.includes('humano') || txt.includes('atendente') || txt.includes('pessoa')) {
            respostaRobo = `Entendido! Vou encaminhar você para o suporte humano agora mesmo. Por favor, aguarde alguns minutos.`
            await supabase.from('whatsapp_conversas').update({ status: 'aguardando_humano' }).eq('id', ativa.id)
          }

          await supabase.from('whatsapp_mensagens').insert({
            conversa_id: ativa.id,
            remetente: 'ia',
            tipo: 'texto',
            conteudo: respostaRobo
          })
        }

        await supabase
          .from('whatsapp_conversas')
          .update({ ultima_mensagem_em: new Date().toISOString() })
          .eq('id', ativa.id)
      }

      toast.success('Mensagem do cliente simulada com sucesso!')

      // Recarrega todos os dados
      await loadMensagens(ativa.id)
      await loadConversas(empresa.id)
    } catch (err) {
      console.error(err)
      toast.error('Erro na simulação de mensagem.')
    } finally {
      setSimulando(false)
    }
  }

  // Filtra as conversas localmente de acordo com a aba selecionada
  const filtradas = conversas.filter((c) => {
    if (filtro === 'todas') return true
    return c.status === filtro
  })

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">WhatsApp</h1>
          <p className="text-sm text-ink-muted">Conversas atendidas pela IA — assuma quando precisar.</p>
        </div>
        
        {ativa && (
          <button
            onClick={() => setSimuladorAberto(true)}
            className="btn-secondary !py-2 !text-xs flex items-center gap-2 border-ia text-ia-600 hover:bg-ia-100/30"
          >
            <Sparkles size={14} className="text-ia" />
            Simular Mensagem de Cliente
          </button>
        )}
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
        <div className="card grid grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr] flex-1">
          {/* Barra Lateral de Conversas */}
          <div className="flex flex-col overflow-hidden border-r border-surface-border bg-white">
            {/* Abas de Filtros */}
            <div className="grid grid-cols-4 gap-1 border-b border-surface-border p-2 bg-surface/35">
              {(['todas', 'aberta', 'aguardando_humano', 'fechada'] as FiltroStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    filtro === f
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-ink-muted hover:bg-surface'
                  }`}
                >
                  {f === 'todas' ? 'Tudo' : f === 'aberta' ? 'IA' : f === 'aguardando_humano' ? 'Op' : 'Fim'}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border">
              {filtradas.length === 0 ? (
                <p className="p-4 text-center text-xs text-ink-soft">Nenhuma conversa encontrada neste filtro.</p>
              ) : (
                filtradas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAtiva(c)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface/50 ${
                      ativa?.id === c.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand">
                      {initials(c.cliente?.nome ?? c.numero_whatsapp)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.cliente?.nome ?? c.numero_whatsapp}</p>
                      <p className="truncate text-[11px] text-ink-soft">{c.numero_whatsapp}</p>
                    </div>
                    <Badge status={c.status}>
                      {c.status === 'aberta' ? 'IA ativa' : c.status === 'aguardando_humano' ? 'Operador' : 'fechada'}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Área Principal do Chat */}
          {ativa ? (
            <div className="flex flex-col bg-surface/20 overflow-hidden">
              {/* Topbar do Chat */}
              <div className="flex items-center justify-between border-b border-surface-border bg-white px-5 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-ink">{ativa.cliente?.nome ?? ativa.numero_whatsapp}</p>
                  <p className="text-[11px] text-ink-soft">{ativa.numero_whatsapp}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {ativa.status !== 'aberta' && (
                    <button
                      onClick={() => alterarStatus('aberta')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ia bg-ia-100/30 px-2.5 py-1 text-xs font-semibold text-ia-600 hover:bg-ia-100/50"
                      title="Permite que a IA atenda esse cliente de forma automática"
                    >
                      <Power size={13} />
                      Ativar IA
                    </button>
                  )}
                  {ativa.status !== 'fechada' && (
                    <button
                      onClick={() => alterarStatus('fechada')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-surface"
                    >
                      <Check size={13} />
                      Resolver Conversa
                    </button>
                  )}
                  {ativa.status === 'fechada' && (
                    <button
                      onClick={() => alterarStatus('aguardando_humano')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-brand hover:bg-surface"
                    >
                      Reabrir Chat
                    </button>
                  )}
                </div>
              </div>

              {/* Corpo das Mensagens */}
              <div className="flex-1 space-y-3.5 overflow-y-auto p-5 bg-dots">
                {mensagens.length === 0 && (
                  <p className="text-center text-xs text-ink-soft my-10">Inicie uma conversa digitando abaixo.</p>
                )}
                {mensagens.map((m) => (
                  <div key={m.id} className={`flex ${m.remetente === 'cliente' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                        m.remetente === 'cliente'
                          ? 'rounded-tl-sm bg-white border border-surface-border text-ink'
                          : m.remetente === 'ia'
                          ? 'rounded-tr-sm bg-ia-100 text-ia-600 font-medium'
                          : 'rounded-tr-sm bg-brand text-white'
                      }`}
                    >
                      {m.conteudo}
                      <p className="mt-1 text-[10px] opacity-60 text-right">{formatDate(m.enviado_em, true)}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Formulário de Envio (Humano) */}
              <form onSubmit={enviarResposta} className="flex items-center gap-2 border-t border-surface-border bg-white p-3.5 shadow-md">
                <input
                  className="input !py-3"
                  placeholder="Responda como atendente (isso pausará temporariamente a IA)..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  disabled={enviando}
                />
                <button type="submit" disabled={enviando || !novaMensagem.trim()} className="btn-primary !p-3.5 shrink-0">
                  <Send size={16} />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center text-center p-10 bg-white">
              <p className="text-sm text-ink-muted">Selecione uma conversa para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL SIMULADOR DE MENSAGENS DO CLIENTE */}
      {simuladorAberto && ativa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSimuladorAberto(false)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-ia" />
              <h2 className="font-display text-base font-semibold text-ink">Simular WhatsApp do Cliente</h2>
            </div>
            
            <p className="mb-4 text-xs text-ink-muted leading-relaxed">
              Digite uma mensagem como se você fosse o cliente <strong>{ativa.cliente?.nome || ativa.numero_whatsapp}</strong> enviando uma mensagem no WhatsApp do seu estabelecimento. Se o chat estiver sob controle da IA, ela responderá de forma autônoma!
            </p>

            <form onSubmit={enviarSimulacao} className="space-y-4">
              <div>
                <label className="label">Mensagem do Cliente</label>
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Ex: Qual o preço do serviço? Ou: Vocês atendem aos sábados?"
                  value={msgSimulada}
                  onChange={(e) => setMsgSimulada(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSimuladorAberto(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={simulando || !msgSimulada.trim()} className="btn-primary">
                  {simulando ? 'Simulando...' : 'Enviar como Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}