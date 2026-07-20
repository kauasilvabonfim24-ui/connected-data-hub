import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Building, Sliders, Shield, MessageSquare, Info, Smartphone, CheckCircle2, XCircle, QrCode } from 'lucide-react'
import type { RegrasNegocio } from '@/types/database'

type ActiveTab = 'geral' | 'regras_ia' | 'whatsapp'

interface WhatsappInstancia {
  id: string
  empresa_id: string
  status: string | null
  numero_conectado: string | null
  qrcode_base64: string | null
}

export default function Configuracoes() {
  const { empresa, usuario, refreshEmpresa } = useAuth()
  
  // Tab control
  const [activeTab, setActiveTab] = useState<ActiveTab>('geral')

  // General parameters
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [segmento, setSegmento] = useState('')

  // AI Business rules
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('')
  const [intervaloAlmoco, setIntervaloAlmoco] = useState('')
  const [atendeSabado, setAtendeSabado] = useState(false)
  const [atendeDomingo, setAtendeDomingo] = useState(false)
  const [realizaEntregas, setRealizaEntregas] = useState(false)
  const [sinalAntecipadoPercentual, setSinalAntecipadoPercentual] = useState('')
  
  // Payment methods selection list
  const [formasPagamento, setFormasPagamento] = useState<string[]>([])

  const [salvando, setSalvando] = useState(false)

  // WhatsApp instance state
  const [waInstancia, setWaInstancia] = useState<WhatsappInstancia | null>(null)
  const [waLoading, setWaLoading] = useState(true)

  useEffect(() => {
    if (empresa?.id) {
      let ativo = true

      async function fetchInstancia() {
        const { data } = await supabase
          .from('whatsapp_instancias')
          .select('id, empresa_id, status, numero_conectado, qrcode_base64')
          .eq('empresa_id', empresa!.id)
          .maybeSingle()
        if (!ativo) return
        setWaInstancia((data as WhatsappInstancia | null) ?? null)
        setWaLoading(false)
      }

      void fetchInstancia()
      const interval = setInterval(fetchInstancia, 5000)
      return () => {
        ativo = false
        clearInterval(interval)
      }
    }
  }, [empresa?.id])

  // Initialize values when company profile finishes loading
  useEffect(() => {
    if (empresa) {
      setNome(empresa.nome ?? '')
      setTelefone(empresa.telefone ?? '')
      setWhatsapp(empresa.whatsapp_numero ?? '')
      setSegmento(empresa.segmento ?? '')

      const regras: Partial<RegrasNegocio> = empresa.regras_negocio ?? {}
      setHorarioFuncionamento(regras.horario_funcionamento ?? 'Segunda a sexta, das 08h às 18h')
      setIntervaloAlmoco(regras.intervalo_almoco ?? '')
      setAtendeSabado(regras.atende_sabado ?? false)
      setAtendeDomingo(regras.atende_domingo ?? false)
      setRealizaEntregas(regras.realiza_entregas ?? false)
      setSinalAntecipadoPercentual(regras.sinal_antecipado_percentual ? String(regras.sinal_antecipado_percentual) : '')
      setFormasPagamento(regras.formas_pagamento ?? ['PIX', 'Cartão', 'Dinheiro'])
    }
  }, [empresa])

  // Handles adding/removing payment methods
  function toggleFormaPagamento(forma: string) {
    if (formasPagamento.includes(forma)) {
      setFormasPagamento(formasPagamento.filter(f => f !== forma))
    } else {
      setFormasPagamento([...formasPagamento, forma])
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return
    setSalvando(true)

    // Construct JSONB for business rules
    const regras: RegrasNegocio = {
      horario_funcionamento: horarioFuncionamento || 'Segunda a sexta, das 08h às 18h',
      intervalo_almoco: intervaloAlmoco || null,
      atende_sabado: atendeSabado,
      atende_domingo: atendeDomingo,
      realiza_entregas: realizaEntregas,
      formas_pagamento: formasPagamento,
      sinal_antecipado_percentual: sinalAntecipadoPercentual ? Number(sinalAntecipadoPercentual) : null,
      observacoes_gerais: empresa.regras_negocio?.observacoes_gerais ?? []
    }

    const { error } = await supabase
      .from('empresas')
      .update({
        nome,
        telefone,
        whatsapp_numero: whatsapp,
        segmento,
        regras_negocio: regras
      })
      .eq('id', empresa.id)
    
    await refreshEmpresa()
    setSalvando(false)
    
    if (error) {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    } else {
      toast.success('Configurações atualizadas e salvas com sucesso!')
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">Gerencie os dados da sua empresa e configure as regras de comportamento da IA.</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-surface-border pb-px">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'geral'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'
          }`}
        >
          <Building size={16} />
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveTab('regras_ia')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'regras_ia'
              ? 'border-ia text-ia-600'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'
          }`}
        >
          <Sliders size={16} />
          Regras de Negócio & IA
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          type="button"
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'whatsapp'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'
          }`}
        >
          <Smartphone size={16} />
          WhatsApp
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'geral' && (
          <div className="card space-y-4 p-5">
            <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <Building size={18} className="text-brand" />
              Informações do Estabelecimento
            </h2>
            <p className="text-xs text-ink-muted mb-4">Esses dados representam as informações fundamentais da sua empresa.</p>
            
            <div>
              <label className="label">Nome da empresa</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Elétrica do Kauã" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Segmento de Atuação</label>
                <input className="input" placeholder="Ex: eletricista, mecânico, salão de beleza..." value={segmento} onChange={(e) => setSegmento(e.target.value)} />
              </div>
              <div>
                <label className="label">Telefone de Contato</label>
                <input className="input" placeholder="Ex: (11) 99999-8888" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                Número do WhatsApp (Simulado ou Real)
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand">Atendimento</span>
              </label>
              <input className="input" placeholder="Ex: +5511999998888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              <p className="mt-1.5 text-xs text-ink-soft">Esse é o número de telefone que a IA monitorará para responder clientes.</p>
            </div>
          </div>
        )}

        {activeTab === 'regras_ia' && (
          <div className="card space-y-5 p-5">
            <div className="flex items-start gap-3 rounded-xl border border-ia-100 bg-ia-100/20 p-4">
              <Info size={18} className="text-ia mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ia-600">Alinhamento Inteligente do Agente de Atendimento</p>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  As regras configuradas abaixo são consumidas diretamente pela IA Central do WhatsApp. Quando os clientes perguntarem sobre horários, formas de pagamento, agendamentos aos finais de semana ou entregas, o agente formulará respostas dinâmicas baseadas estritamente nessas opções!
                </p>
              </div>
            </div>

            <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <MessageSquare size={18} className="text-ia" />
              Diretrizes do Robô & Escopo de Operações
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Horário de Funcionamento Geral</label>
                <input
                  className="input"
                  value={horarioFuncionamento}
                  onChange={(e) => setHorarioFuncionamento(e.target.value)}
                  placeholder="Ex: Segunda a sexta, das 08h às 18h"
                  required
                />
              </div>
              <div>
                <label className="label">Intervalo de Almoço (opcional)</label>
                <input
                  className="input"
                  value={intervaloAlmoco}
                  onChange={(e) => setIntervaloAlmoco(e.target.value)}
                  placeholder="Ex: 12:00 às 13:00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="label">Disponibilidade de Expediente</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atendeSabado}
                    onChange={(e) => setAtendeSabado(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink">Atende aos Sábados</p>
                    <p className="text-[10px] text-ink-soft">AI responderá que funciona sab.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atendeDomingo}
                    onChange={(e) => setAtendeDomingo(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink">Atende aos Domingos</p>
                    <p className="text-[10px] text-ink-soft">AI confirmará suporte dom.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={realizaEntregas}
                    onChange={(e) => setRealizaEntregas(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink">Faz Entregas / Delivery</p>
                    <p className="text-[10px] text-ink-soft">Habilita orçamentos de frete</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-surface-border pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Formas de Pagamento Aceitas</label>
                  <p className="text-[10px] text-ink-soft mb-2">Marque todas as que você aceita para a IA informar aos clientes:</p>
                  <div className="flex flex-wrap gap-2">
                    {['PIX', 'Cartão', 'Dinheiro', 'Boleto'].map((forma) => {
                      const ativo = formasPagamento.includes(forma)
                      return (
                        <button
                          key={forma}
                          type="button"
                          onClick={() => toggleFormaPagamento(forma)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition ${
                            ativo
                              ? 'bg-ia-100/60 border-ia text-ia-600'
                              : 'bg-white border-surface-border text-ink-muted hover:bg-surface'
                          }`}
                        >
                          {forma}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-1">
                    Sinal Antecipado (%)
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Opcional</span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex: 50 (sem o símbolo %)"
                    value={sinalAntecipadoPercentual}
                    onChange={(e) => setSinalAntecipadoPercentual(e.target.value)}
                  />
                  <p className="mt-1 text-[10px] text-ink-soft">Se preenchido, a IA pedirá esse percentual de depósito prévio para confirmar agendamentos.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="card space-y-5 p-5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
                <Smartphone size={18} className="text-emerald-600" />
                Conexão do WhatsApp
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Vincule o número de WhatsApp da sua empresa para que a IA possa atender seus clientes automaticamente.
              </p>
            </div>

            {waLoading ? (
              <div className="rounded-xl border border-surface-border bg-surface/30 p-6 text-center text-sm text-ink-muted">
                Verificando status da conexão...
              </div>
            ) : waInstancia?.status === 'conectado' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    WhatsApp conectado
                  </span>
                </div>
                {waInstancia.numero_conectado && (
                  <p className="mt-3 text-sm font-semibold text-emerald-800">
                    {waInstancia.numero_conectado}
                  </p>
                )}
                <p className="mt-1 text-xs text-emerald-700/80">
                  A IA está apta a receber e responder mensagens neste número.
                </p>
              </div>
            ) : waInstancia?.status === 'conectando' && waInstancia.qrcode_base64 ? (
              <div className="rounded-xl border border-surface-border bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode size={18} className="text-brand" />
                  <p className="text-sm font-semibold text-ink">
                    Escaneie este QR code com o WhatsApp da empresa
                  </p>
                </div>
                <p className="text-xs text-ink-muted mb-4">
                  Abra o WhatsApp no celular &rarr; <strong>Configurações</strong> &rarr; <strong>Aparelhos conectados</strong> &rarr; <strong>Conectar aparelho</strong>, e aponte a câmera para o código abaixo.
                </p>
                <div className="flex justify-center rounded-xl bg-surface/40 p-4">
                  <img
                    src={waInstancia.qrcode_base64}
                    alt="QR code de conexão do WhatsApp"
                    className="h-64 w-64 rounded-lg border border-surface-border bg-white"
                  />
                </div>
                <p className="mt-3 text-center text-[10px] text-ink-soft">
                  O código atualiza automaticamente a cada poucos segundos.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-amber-600" />
                  <span className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                    WhatsApp não conectado
                  </span>
                </div>
                <p className="mt-3 text-xs text-amber-800">
                  Ainda não há uma instância ativa do WhatsApp vinculada à sua empresa. A conexão precisa ser configurada para que a IA possa atender seus clientes. Assim que a instância for iniciada, o QR code para pareamento aparecerá aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'whatsapp' && (
          <div className="flex items-center gap-3">
            <button type="submit" disabled={salvando} className="btn-primary !px-6 shadow-md">
              {salvando ? 'Salvando alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </form>

      <div className="card mt-6 p-5 border-l-4 border-l-brand bg-white">
        <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
          <Shield size={16} className="text-brand" />
          Sessão Segura de Usuário
        </h3>
        <p className="mt-1 text-xs text-ink-muted">Logado atualmente como: <strong className="font-semibold">{usuario?.email}</strong> no nível de acesso <strong className="text-brand uppercase">{usuario?.role}</strong>.</p>
      </div>
    </div>
  )
}
<dyad-chat-summary>Adding WhatsApp connection status section to Configuracoes page with polling</dyad-chat-summary>
<dyad-write path="src/pages/Configuracoes.tsx" description="Completing the WhatsApp section and closing the Configuracoes component">
          {activeTab !== 'whatsapp' && (
            <div className="flex items-center gap-3">
              <button type="submit" disabled={salvando} className="btn-primary !px-6 shadow-md">
                {salvando ? 'Salvando alterações...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
      </form>

      <div className="card mt-6 p-5 border-l-4 border-l-brand bg-white">
        <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
          <Shield size={16} className="text-brand" />
          Sessão Segura de Usuário
        </h3>
        <p className="mt-1 text-xs text-ink-muted">Logado atualmente como: <strong className="font-semibold">{usuario?.email}</strong> no nível de acesso <strong className="text-brand uppercase">{usuario?.role}</strong>.</p>
      </div>
    </div>
  )
}
<dyad-chat-summary>Adding WhatsApp connection status section to Configuracoes page with polling</dyad-chat-summary><dyad-write path="src/pages/Configuracoes.tsx" description="Complete Configuracoes page with WhatsApp connection status section and polling">
import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Building, Sliders, Shield, MessageSquare, Info, Smartphone, CheckCircle2, XCircle, QrCode } from 'lucide-react'
import type { RegrasNegocio } from '@/types/database'

type ActiveTab = 'geral' | 'regras_ia' | 'whatsapp'

interface WhatsappInstancia {
  id: string
  empresa_id: string
  status: string | null
  numero_conectado: string | null
  qrcode_base64: string | null
}

export default function Configuracoes() {
  const { empresa, usuario, refreshEmpresa } = useAuth()
  
  // Tab control
  const [activeTab, setActiveTab] = useState<ActiveTab>('geral')

  // General parameters
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [segmento, setSegmento] = useState('')

  // AI Business rules
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('')
  const [intervaloAlmoco, setIntervaloAlmoco] = useState('')
  const [atendeSabado, setAtendeSabado] = useState(false)
  const [atendeDomingo, setAtendeDomingo] = useState(false)
  const [realizaEntregas, setRealizaEntregas] = useState(false)
  const [sinalAntecipadoPercentual, setSinalAntecipadoPercentual] = useState('')
  
  // Payment methods selection list
  const [formasPagamento, setFormasPagamento] = useState<string[]>([])

  const [salvando, setSalvando] = useState(false)

  // WhatsApp instance state
  const [waInstancia, setWaInstancia] = useState<WhatsappInstancia | null>(null)
  const [waLoading, setWaLoading] = useState(true)

  // Polling for WhatsApp instance status every 5 seconds
  useEffect(() => {
    if (!empresa?.id) return

    let isActive = true
    const fetchInstancia = async () => {
      if (!isActive) return
      const { data } = await supabase
        .from('whatsapp_instancias')
        .select('id, empresa_id, status, numero_conectado, qrcode_base64')
        .eq('empresa_id', empresa.id)
        .maybeSingle()
      setWaInstancia(data as WhatsappInstancia | null)
      setWaLoading(false)
    }

    // Initial load
    void fetchInstancia()

    // Poll every 5 seconds
    const interval = setInterval(fetchInstancia, 5000)

    // Cleanup on unmount or when empresa.id changes
    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [empresa?.id])

  // Initialize values when company profile finishes loading
  useEffect(() => {
    if (empresa) {
      setNome(empresa.nome ?? '')
      setTelefone(empresa.telefone ?? '')
      setWhatsapp(empresa.whatsapp_numero ?? '')
      setSegmento(empresa.segmento ?? '')

      const regras: Partial<RegrasNegocio> = empresa.regras_negocio ?? {}
      setHorarioFuncionamento(regras.horario_funcionamento ?? 'Segunda a sexta, das 08h às 18h')
      setIntervaloAlmoco(regras.intervalo_almoco ?? '')
      setAtendeSabado(regras.atende_sabado ?? false)
      setAtendeDomingo(regras.atende_domingo ?? false)
      setRealizaEntregas(regras.realiza_entregas ?? false)
      setSinalAntecipadoPercentual(
        regras.sinal_antecipado_percentual ? String(regras.sinal_antecipado_percentual) : ''
      )
      setFormasPagamento(regras.formas_pagamento ?? ['PIX', 'Cartão', 'Dinheiro'])
    }
  }, [empresa])

  // Handles adding/removing payment methods
  function toggleFormaPagamento(forma: string) {
    if (formasPagamento.includes(forma)) {
      setFormasPagamento(formasPagamento.filter((f) => f !== forma))
    } else {
      setFormasPagamento([...formasPagamento, forma])
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return
    setSalvando(true)

    // Construct JSONB for business rules
    const regras: RegrasNegocio = {
      horario_funcionamento: horarioFuncionamento || 'Segunda a sexta, das 08h às 18h',
      intervalo_almoco: intervaloAlmoco || null,
      atende_sabado: atendeSabado,
      atende_domingo: atendeDomingo,
      realiza_entregas: realizaEntregas,
      formas_pagamento: formasPagamento,
      sinal_antecipado_percentual:
        sinalAntecipadoPercentual ? Number(sinalAntecipadoPercentual) : null,
      observacoes_gerais: empresa.regras_negocio?.observacoes_gerais ?? [],
    }

    const { error } = await supabase
      .from('empresas')
      .update({
        nome,
        telefone,
        whatsapp_numero: whatsapp,
        segmento,
        regras_negocio: regras,
      })
      .eq('id', empresa.id)

    await refreshEmpresa()
    setSalvando(false)

    if (error) {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    } else {
      toast.success('Configurações atualizadas e salvas com sucesso!')
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">
          Gerencie os dados da sua empresa e configure as regras de comportamento da IA.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="mb-6 flex gap-2 border-b border-surface-border pb-px">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'geral'
              ? 'border-brand text-brand'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'
          }`}
        >
          <Building size={16} />
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveTab('regras_ia')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'regras_ia'
              ? 'border-ia text-ia-600'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'
          }`}
        >
          <Sliders size={16} />
          Regras de Negócio & IA
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          type="button"
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'whatsapp'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'
          }`}
        >
          <Smartphone size={16} />
          WhatsApp
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'geral' && (
          <div className="card space-y-4 p-5">
            <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <Building size={18} className="text-brand" />
              Informações do Estabelecimento
            </h2>
            <p className="text-xs text-ink-muted mb-4">
              Esses dados representam as informações fundamentais da sua empresa.
            </p>
            
            <div>
              <label className="label">Nome da empresa</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Elétrica do Kauã" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Segmento de Atuação</label>
                <input className="input" placeholder="Ex: eletricista, mecânico, salão de beleza..." value={segmento} onChange={(e) => setSegmento(e.target.value)} />
              </div>
              <div>
                <label className="label">Telefone de Contato</label>
                <input className="input" placeholder="Ex: (11) 99999-8888" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                Número do WhatsApp (Simulado ou Real)
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand">Atendimento</span>
              </label>
              <input className="input" placeholder="Ex: +5511999998888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              <p className="mt-1.5 text-xs text-ink-soft">
                Esse é o número de telefone que a IA monitorará para responder clientes.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'regras_ia' && (
          <div className="card space-y-5 p-5">
            <div className="flex items-start gap-3 rounded-xl border border-ia-100 bg-ia-100/20 p-4">
              <Info size={18} className="text-ia mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ia-600">Alinhamento Inteligente do Agente de Atendimento</p>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  As regras configuradas abaixo são consumidas diretamente pela IA Central do WhatsApp. Quando os clientes perguntarem sobre horários, formas de pagamento, agendamentos aos finais de semana ou entregas, o agente formulará respostas dinâmicas baseadas estritamente nessas opções!
                </p>
              </div>
            </div>

            <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <MessageSquare size={18} className="text-ia" />
              Diretrizes do Robô & Escopo de Operações
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Horário de Funcionamento Geral</label>
                <input
                  className="input"
                  value={horarioFuncionamento}
                  onChange={(e) => setHorarioFuncionamento(e.target.value)}
                  placeholder="Ex: Segunda a sexta, das 08h às 18h"
                  required
                />
              </div>
              <div>
                <label className="label">Intervalo de Almoço (opcional)</label>
                <input
                  className="input"
                  value={intervaloAlmoco}
                  onChange={(e) => setIntervaloAlmoco(e.target.value)}
                  placeholder="Ex: 12:00 às 13:00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="label">Disponibilidade de Expediente</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atendeSabado}
                    onChange={(e) => setAtendeSabado(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink">Atende aos Sábados</p>
                    <p className="text-[10px] text-ink-soft">AI responderá que funciona sab.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atendeDomingo}
                    onChange={(e) => setAtendeDomingo(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink">Atende aos Domingos</p>
                    <p className="text-[10px] text-ink-soft">AI confirmará suporte dom.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={realizaEntregas}
                    onChange={(e) => setRealizaEntregas(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia"
                  />
                  <div>
                    <p className="text-xs font-semibold text-ink">Faz Entregas / Delivery</p>
                    <p className="text-[10px] text-ink-soft">Habilita orçamentos de frete</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-surface-border pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Formas de Pagamento Aceitas</label>
                  <p className="text-[10px] text-ink-soft mb-2">
                    Marque todas as que você aceita para a IA informar aos clientes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['PIX', 'Cartão', 'Dinheiro', 'Boleto'].map((forma) => {
                      const ativo = formasPagamento.includes(forma)
                      return (
                        <button
                          key={forma}
                          type="button"
                          onClick={() => toggleFormaPagamento(forma)}
                          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition ${
                            ativo
                              ? 'bg-ia-100/60 border-ia text-ia-600'
                              : 'bg-white border-surface-border text-ink-muted hover:bg-surface'
                          }`}
                        >
                          {forma}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-1">
                    Sinal Antecipado (%)
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Opcional</span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex: 50 (sem o símbolo %)"
                    value={sinalAntecipadoPercentual}
                    onChange={(e) => setSinalAntecipadoPercentual(e.target.value)}
                  />
                  <p className="mt-1 text-[10px] text-ink-soft">
                    Se preenchido, a IA pedirá esse percentual de depósito prévio para confirmar agendamentos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="card space-y-5 p-5">
            <div>
              <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
                <Smartphone size={18} className="text-emerald-600" />
                Conexão do WhatsApp
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Vincule o número de WhatsApp da sua empresa para que a IA possa atender seus clientes automaticamente.
              </p>
            </div>

            {waLoading ? (
              <div className="rounded-xl border border-surface-border bg-surface/30 p-6 text-center text-sm text-ink-muted">
                Verificando status da conexão...
              </div>
            ) : waInstancia?.status === 'conectado' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    WhatsApp conectado
                  </span>
                </div>
                {waInstancia.numero_conectado && (
                  <p className="mt-3 text-sm font-semibold text-emerald-800">
                    {waInstancia.numero_conectado}
                  </p>
                )}
                <p className="mt-1 text-xs text-emerald-700/80">
                  A IA está apta a receber e responder mensagens neste número.
                </p>
              </div>
            ) : waInstancia?.status === 'conectando' && waInstancia.qrcode_base64 ? (
              <div className="rounded-xl border border-surface-border bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode size={18} className="text-brand" />
                  <p className="text-sm font-semibold text-ink">
                    Escaneie este QR code com o WhatsApp da empresa
                  </p>
                </div>
                <p className="text-xs text-ink-muted mb-4">
                  Abra o WhatsApp no celular &rarr; <strong>Configurações</strong> &rarr; <strong>Aparelhos conectados</strong> &rarr; <strong>Conectar aparelho</strong>, e aponte a câmera para o código abaixo.
                </p>
                <div className="flex justify-center rounded-xl bg-surface/40 p-4">
                  <img
                    src={waInstancia.qrcode_base64}
                    alt="QR code de conexão do WhatsApp"
                    className="h-64 w-64 rounded-lg border border-surface-border bg-white"
                  />
                </div>
                <p className="mt-3 text-center text-[10px] text-ink-soft">
                  O código atualiza automaticamente a cada poucos segundos.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-amber-600" />
                  <span className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                    WhatsApp não conectado
                  </span>
                </div>
                <p className="mt-3 text-xs text-amber-800">
                  Ainda não há uma instância ativa do WhatsApp vinculada à sua empresa. A conexão precisa ser configurada para que a IA possa atender seus clientes. Assim que a instância for iniciada, o QR code para pareamento aparecerá aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'whatsapp' && (
          <div className="flex items-center gap-3">
            <button type="submit" disabled={salvando} className="btn-primary !px-6 shadow-md">
              {salvando ? 'Salvando alterações...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </form>

      <div className="card mt-6 p-5 border-l-4 border-l-brand bg-white">
        <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
          <Shield size={16} className="text-brand" />
          Sessão Segura de Usuário
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          Logado atualmente como: <strong className="font-semibold">{usuario?.email}</strong> no nível de acesso <strong className="text-brand uppercase">{usuario?.role}</strong>.
        </p>
      </div>
    </div>
  )
}