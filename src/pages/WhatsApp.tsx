"use client";

import React, { useEffect, useState, useRef } from 'react'
import { MessageCircle, Sparkles, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import EmptyState from '@/components/ui/EmptyState'
import { toast } from '@/lib/toast'
import type { WhatsappConversa, WhatsappMensagem } from '@/types/database'

// Import modular subcomponents
import ConnectionPanel, { ConexaoStatus } from '@/components/whatsapp/ConnectionPanel'
import ConversationsSidebar from '@/components/whatsapp/ConversationsSidebar'
import ChatArea from '@/components/whatsapp/ChatArea'
import SimuladorModal from '@/components/whatsapp/SimuladorModal'

type FiltroStatus = 'todas' | 'aberta' | 'aguardando_humano' | 'fechada'

export default function WhatsApp() {
  const { empresa, refreshEmpresa } = useAuth()
  const [conversas, setConversas] = useState<WhatsappConversa[]>([])
  const [ativa, setAtiva] = useState<WhatsappConversa | null>(null)
  const [mensagens, setMensagens] = useState<WhatsappMensagem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Controls & Toggles
  const [filtro, setFiltro] = useState<FiltroStatus>('todas')
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [simuladorAberto, setSimuladorAberto] = useState(false)
  const [msgSimulada, setMsgSimulada] = useState('')
  const [simulando, setSimulando] = useState(false)

  // WhatsApp Connectivity Panels
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
    
    // Generate simulated setup payloads for QR codes
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

      {/* Connection Panel */}
      {showConnectionPanel && (
        <ConnectionPanel
          statusConexao={statusConexao}
          numeroConectado={numeroConectado}
          ultimaSincronizacao={ultimaSincronizacao}
          qrCodeData={qrCodeData}
          gerandoQr={gerandoQr}
          onClose={() => setShowConnectionPanel(false)}
          onIniciarConexao={iniciarConexao}
          onSimularEscaneamento={simularEscaneamento}
          onDesconectar={desconectarWhatsapp}
        />
      )}

      {/* Conversations and Chats listing section */}
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
          {/* Sidebar Area */}
          <ConversationsSidebar
            conversas={filtradas}
            ativa={ativa}
            setAtiva={setAtiva}
            filtro={filtro}
            setFiltro={setFiltro}
          />

          {/* Active Chat Area */}
          {ativa ? (
            <ChatArea
              ativa={ativa}
              mensagens={mensagens}
              novaMensagem={novaMensagem}
              setNovaMensagem={setNovaMensagem}
              enviando={enviando}
              onEnviarResposta={enviarResposta}
              onAlterarStatus={alterarStatus}
              chatEndRef={chatEndRef}
            />
          ) : (
            <div className="flex items-center justify-center text-center p-10 bg-white">
              <p className="text-sm text-ink-muted">Selecione uma conversa para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Simulator Modal */}
      {simuladorAberto && ativa && (
        <SimuladorModal
          open={simuladorAberto}
          nomeCliente={ativa.cliente?.nome || ativa.numero_whatsapp}
          msgSimulada={msgSimulada}
          setMsgSimulada={setMsgSimulada}
          simulando={simulando}
          onClose={() => setSimuladorAberto(false)}
          onSubmit={enviarSimulacao}
        />
      )}
    </div>
  )
}