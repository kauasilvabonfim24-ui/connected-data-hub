import { useEffect, useState, useRef } from 'react'
import { MessageCircle, Send, Sparkles, Check, Power, RefreshCw, QrCode, Wifi, WifiOff, Calendar, ShieldCheck, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, initials } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { toast } from '@/lib/toast'
import type { WhatsappConversa, WhatsappMensagem } from '@/types/database'

type FiltroStatus = 'todas' | 'aberta' | 'aguardando_humano' | 'fechada'
type ConexaoStatus = 'Conectado' | 'Desconectado' | 'Conectando' | 'Erro na conexão'

export default function WhatsApp() {
  const { empresa, refreshEmpresa } = useAuth()
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

  // WhatsApp Connection States
  const [showConnectionPanel, setShowConnectionPanel] = useState(false)
  const [statusConexao, setStatusConexao] = useState<ConexaoStatus>('Desconectado')
  const [numeroConectado, setNumeroConectado] = useState('')
  const [dataConexao, setDataConexao] = useState('')
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [gerandoQr, setGerandoQr] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load connection states from company regras_negocio
  useEffect(() => {
    if (empresa) {
      const conexao = (empresa.regras_negocio as any)?.whatsapp_conexao
      setStatusConexao(conexao?.status || 'Desconectado')
      setNumeroConectado(conexao?.numero || empresa.whatsapp_numero || '')
      setDataConexao(conexao?.data_conexao || '')
      setUltimaSincronizacao(conexao?.ultima_sincronizacao || '')
    }
  }, [empresa])

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

  // Handles starting connection flow & QR generation
  async function iniciarConexao() {
    setGerandoQr(true)
    setStatusConexao('Conectando')
    
    // Generate simulated setup payloads for real-world QR validation
    const qrPayload = `servix-ia-session-${empresa?.id || Math.random().toString()}-${Date.now()}`
    setQrCodeData(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`)
    setGerandoQr(false)

    // Automatically register connecting status in database
    await atualizarConexaoBanco('Conectando', '', '', '')
  }

  // Simulates scanning the connection QR code successfully
  async function simularEscaneamento() {
    if (!empresa?.id) return
    const mockNumber = `+55 (11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
    const nowStr = new Date().toISOString()

    setStatusConexao('Conectado')
    setNumeroConectado(mockNumber)
    setDataConexao(nowStr)
    setUltimaSincronizacao(nowStr)
    setQrCodeData('')

    await atualizarConexaoBanco('Conectado', mockNumber, nowStr, nowStr)
    toast.success('WhatsApp conectado e sincronizado com sucesso!')
  }

  // Handles disconnection flow
  async function desconectarWhatsapp() {
    if (!empresa?.id) return
    if (!confirm('Tem certeza que deseja desconectar este WhatsApp? O assistente automático de respostas será desligado imediatamente.')) return

    setStatusConexao('Desconectado')
    setNumeroConectado('')
    setDataConexao('')
    setUltimaSincronizacao('')
    setQrCodeData('')

    await atualizarConexaoBanco('Desconectado', '', '', '')
    toast.success('WhatsApp desconectado. Respostas automáticas desativadas.')
  }

  // Helper to persist connection data to public.empresas regras_negocio JSONB
  async function atualizarConexaoBanco(status: ConexaoStatus, numero: string, dataCon: string, ultimaSinc: string) {
    if (!empresa?.id) return

    const regrasAtuais = empresa.regras_negocio || {}
    const novasRegras = {
      ...regrasAtuais,
      whatsapp_conexao: {
        status,
        numero,
        data_conexao: dataCon,
        ultima_sincronizacao: ultimaSinc
      }
    }

    const { error } = await supabase
      .from('empresas')
      .update({
        regras_negocio: novasRegras,
        whatsapp_numero: numero || null
      })
      .eq('id', empresa.id)

    if (error) {
      toast.error(`Erro ao salvar status de conexão: ${error.message}`)
    } else {
      await refreshEmpresa()
    }
  }

  // Envia mensagem como atendente (humano)
  async function enviarResposta(e: React.FormEvent) {
    e.preventDefault()
    if (!novaMensagem.trim() || !ativa || !empresa?.id) return

    setEnviando(true)
    const texto = novaMensagem.trim()
    setNovaMensagem('')

    try {
      await supabase.from('whatsapp_mensagens').insert({
        conversa_id: ativa.id,
        remetente: 'atendente',
        tipo: 'texto',
        conteudo: texto
      })

      await supabase
        .from('whatsapp_conversas')
        .update({
          status: 'aguardando_humano',
          ultima_mensagem_em: new Date().toISOString()
        })
        .eq('id', ativa.id)

      toast.success('Mensagem enviada como atendente. IA pausada temporariamente.')

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
        
        await supabase.from('whatsapp_mensagens').insert({
          conversa_id: ativa.id,
          remetente: 'cliente',
          tipo: 'texto',
          conteudo: texto
        })

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

      await loadMensagens(ativa.id)
      await loadConversas(empresa.id)
    } catch (err) {
      console.error(err)
      toast.error('Erro na simulação de mensagem.')
    } finally {
      setSimulando(false)
    }
  }

  const filtradas = conversas.filter((c) => {
    if (filtro === 'todas') return true
    return c.status === filtro
  })

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col space-y-4">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">WhatsApp</h1>
          <p className="text-sm text-ink-muted">Conecte seu dispositivo e gerencie o assistente automático.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConnectionPanel(!showConnectionPanel)}
            className={`btn-secondary !py-2 !text-xs flex items-center gap-2 border-brand-100 ${
              statusConexao === 'Conectado' ? 'bg-ia-100/30 border-ia text-ia-600' : ''
            }`}
          >
            {statusConexao === 'Conectado' ? <Wifi size={14} /> : <WifiOff size={14} />}
            Status: {statusConexao}
          </button>
          {ativa && (
            <button
              onClick={() => setSimuladorAberto(true)}
              className="btn-secondary !py-2 !text-xs flex items-center gap-2 border-ia text-ia-600 hover:bg-ia-100/30"
            >
              <Sparkles size={14} className="text-ia" />
              Simular Mensagem
            </button>
          )}
        </div>
      </div>

      {/* WHATSAPP CONNECTION PANEL */}
      {showConnectionPanel && (
        <div className="card p-5 bg-white border-brand-50 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
            <h3 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <QrCode size={18} className="text-brand" />
              Conexão do Dispositivo WhatsApp
            </h3>
            <button onClick={() => setShowConnectionPanel(false)} className="text-ink-soft hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Status Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  statusConexao === 'Conectado' ? 'bg-ia-100 text-ia-600' :
                  statusConexao === 'Conectando' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    statusConexao === 'Conectado' ? 'bg-ia' :
                    statusConexao === 'Conectando' ? 'bg-amber' : 'bg-rose-600'
                  }`} />
                </span>
                <div>
                  <p className="text-xs text-ink-soft leading-none">Estado de Conexão</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">{statusConexao}</p>
                </div>
              </div>

              {statusConexao === 'Conectado' && (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-surface/50 p-3 rounded-xl border border-surface-border">
                    <div>
                      <p className="text-[10px] text-ink-soft">Número Conectado</p>
                      <p className="text-xs font-semibold text-ink mt-0.5">{numeroConectado}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-ink-soft">Sincronizado em</p>
                      <p className="text-xs font-semibold text-ink mt-0.5">{formatDate(ultimaSincronizacao || new Date(), true)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ia-600 bg-ia-100/20 p-2.5 rounded-xl border border-ia-100/50">
                    <ShieldCheck size={14} className="shrink-0" />
                    Respostas automáticas do robô estão ativas e monitorando as mensagens.
                  </div>
                </>
              )}

              {statusConexao !== 'Conectado' && (
                <p className="text-xs text-ink-muted leading-relaxed">
                  Conecte seu celular para que o Servix IA possa ler e responder às mensagens dos seus clientes no WhatsApp. Caso esteja desconectado, o robô suspenderá todos os envios automáticos imediatamente.
                </p>
              )}

              <div className="flex gap-2">
                {statusConexao === 'Desconectado' && (
                  <button onClick={iniciarConexao} disabled={gerandoQr} className="btn-primary !py-2 !text-xs">
                    Gerar QR Code de Conexão
                  </button>
                )}
                {statusConexao === 'Conectando' && (
                  <button onClick={simularEscaneamento} className="btn-primary !py-2 !text-xs !bg-ia hover:!bg-ia-600">
                    Simular Escaneamento (Conectar)
                  </button>
                )}
                {statusConexao !== 'Desconectado' && (
                  <button onClick={desconectarWhatsapp} className="btn-secondary !py-2 !text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                    Desconectar Aparelho
                  </button>
                )}
              </div>
            </div>

            {/* QR Code display area */}
            <div className="flex flex-col items-center justify-center p-4 bg-surface/35 rounded-2xl border border-surface-border border-dashed min-h-[220px]">
              {statusConexao === 'Conectando' && qrCodeData ? (
                <div className="text-center space-y-3">
                  <img src={qrCodeData} alt="WhatsApp Connection QR Code" className="w-40 h-40 object-contain rounded-lg border bg-white p-1" />
                  <p className="text-[10px] text-ink-soft font-mono">Escaneie o código acima usando o WhatsApp Web</p>
                </div>
              ) : statusConexao === 'Conectado' ? (
                <div className="text-center space-y-2 text-ia-600">
                  <Wifi size={32} className="mx-auto text-ia animate-pulse" />
                  <p className="text-xs font-semibold">Seu WhatsApp está emparelhado!</p>
                  <p className="text-[10px] text-ink-soft">Atendimento automatizado 24h em execução.</p>
                </div>
              ) : (
                <div className="text-center space-y-2 text-ink-soft">
                  <WifiOff size={32} className="mx-auto" />
                  <p className="text-xs">Aparelho Desconectado</p>
                  <p className="text-[10px]">Gere um novo código QR para conectar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHATS GRID SECTION */}
      {loading ? (
        <p className="text-sm text-ink-muted">Carregando...</p>
      ) : conversas.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={28} />}
          title="Nenhuma conversa ainda"
          description="Assim que o número do WhatsApp for conectado, as conversas atendidas pela IA aparecerão aqui."
        />
      ) : (
        <div className="card grid grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr] flex-1 min-h-0">
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