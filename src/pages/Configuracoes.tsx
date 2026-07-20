import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Building, Sliders, Shield, Smartphone } from 'lucide-react'
import type { RegrasNegocio } from '@/types/database'
import EmpresaForm from '@/components/configuracoes/EmpresaForm'
import RegrasIAForm from '@/components/configuracoes/RegrasIAForm'
import WhatsAppConnection from '@/components/configuracoes/WhatsAppConnection'

type ActiveTab = 'geral' | 'regras_ia' | 'whatsapp'

export default function Configuracoes() {
  const { empresa, usuario, refreshEmpresa } = useAuth()

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
  const [formasPagamento, setFormasPagamento] = useState<string[]>([])

  const [salvando, setSalvando] = useState(false)

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
      .update({ nome, telefone, whatsapp_numero: whatsapp, segmento, regras_negocio: regras })
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

      <div className="mb-6 flex gap-2 border-b border-surface-border pb-px">
        <button onClick={() => setActiveTab('geral')} className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${activeTab === 'geral' ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'}`}>
          <Building size={16} /> Dados da Empresa
        </button>
        <button onClick={() => setActiveTab('regras_ia')} className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${activeTab === 'regras_ia' ? 'border-ia text-ia-600' : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'}`}>
          <Sliders size={16} /> Regras de Negócio & IA
        </button>
        <button onClick={() => setActiveTab('whatsapp')} type="button" className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${activeTab === 'whatsapp' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-ink-muted hover:text-ink hover:border-surface-border'}`}>
          <Smartphone size={16} /> WhatsApp
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'geral' && (
          <EmpresaForm
            nome={nome} setNome={setNome}
            telefone={telefone} setTelefone={setTelefone}
            whatsapp={whatsapp} setWhatsapp={setWhatsapp}
            segmento={segmento} setSegmento={setSegmento}
          />
        )}

        {activeTab === 'regras_ia' && (
          <RegrasIAForm
            horarioFuncionamento={horarioFuncionamento} setHorarioFuncionamento={setHorarioFuncionamento}
            intervaloAlmoco={intervaloAlmoco} setIntervaloAlmoco={setIntervaloAlmoco}
            atendeSabado={atendeSabado} setAtendeSabado={setAtendeSabado}
            atendeDomingo={atendeDomingo} setAtendeDomingo={setAtendeDomingo}
            realizaEntregas={realizaEntregas} setRealizaEntregas={setRealizaEntregas}
            sinalAntecipadoPercentual={sinalAntecipadoPercentual} setSinalAntecipadoPercentual={setSinalAntecipadoPercentual}
            formasPagamento={formasPagamento} toggleFormaPagamento={toggleFormaPagamento}
          />
        )}

        {activeTab === 'whatsapp' && <WhatsAppConnection />}

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