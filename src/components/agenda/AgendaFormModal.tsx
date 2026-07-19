"use client";

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import type { Cliente, Servico, Agendamento, AgendamentoStatus } from '@/types/database'

interface Props {
  open: boolean
  agendamento: Agendamento | null
  onClose: () => void
  onSaved: () => void
}

export default function AgendaFormModal({ open, agendamento, onClose, onSaved }: Props) {
  const { empresa } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  
  const [clienteId, setClienteId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [status, setStatus] = useState<AgendamentoStatus>('agendado')
  const [dataHoraInicio, setDataHoraInicio] = useState('')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')
  
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open && empresa?.id) {
      void carregarDadosAuxiliares(empresa.id)
    }
  }, [open, empresa?.id])

  useEffect(() => {
    if (open) {
      if (agendamento) {
        setClienteId(agendamento.cliente_id)
        setServicoId(agendamento.servico_id ?? '')
        setStatus(agendamento.status)
        
        if (agendamento.data_hora_inicio) {
          const dt = new Date(agendamento.data_hora_inicio)
          const tzOffset = dt.getTimezoneOffset() * 60000
          const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16)
          setDataHoraInicio(localISOTime)
        } else {
          setDataHoraInicio('')
        }
        
        setValor(agendamento.valor ? String(agendamento.valor) : '')
        setObservacoes(agendamento.observacoes ?? '')
      } else {
        setClienteId('')
        setServicoId('')
        setStatus('agendado')
        setDataHoraInicio('')
        setValor('')
        setObservacoes('')
      }
    }
  }, [open, agendamento])

  // Ajustar o valor sugerido de acordo com o serviço selecionado (se for criação)
  useEffect(() => {
    if (!agendamento && servicoId) {
      const servicoSel = servicos.find(s => s.id === servicoId)
      if (servicoSel) {
        setValor(String(servicoSel.preco))
        toast.success(`Preço sugerido aplicado: R$ ${Number(servicoSel.preco).toFixed(2).replace('.', ',')}`, { id: 'price-suggest' })
      }
    }
  }, [servicoId, servicos, agendamento])

  async function carregarDadosAuxiliares(empresaId: string) {
    setCarregandoDados(true)
    const [clientesRes, servicosRes] = await Promise.all([
      supabase.from('clientes').select('*').eq('empresa_id', empresaId).order('nome'),
      supabase.from('servicos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome')
    ])
    setClientes((clientesRes.data as Cliente[]) ?? [])
    setServicos((servicosRes.data as Servico[]) ?? [])
    setCarregandoDados(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return

    if (!clienteId) {
      toast.error('Por favor, selecione um cliente.')
      return
    }
    if (!dataHoraInicio) {
      toast.error('Por favor, selecione a data e hora de início.')
      return
    }

    const valorNum = valor ? Number(valor.replace(',', '.')) : null
    if (valor && (isNaN(Number(valorNum)) || Number(valorNum) < 0)) {
      toast.error('Insira um valor numérico válido.')
      return
    }

    setSalvando(true)
    
    const payload = {
      empresa_id: empresa.id,
      cliente_id: clienteId,
      servico_id: servicoId || null,
      status,
      data_hora_inicio: new Date(dataHoraInicio).toISOString(),
      valor: valorNum,
      observacoes: observacoes || null
    }

    let error = null
    if (agendamento) {
      const res = await supabase
        .from('agendamentos')
        .update(payload)
        .eq('id', agendamento.id)
      error = res.error
    } else {
      const res = await supabase
        .from('agendamentos')
        .insert(payload)
      error = res.error
    }

    setSalvando(false)
    if (error) {
      toast.error(`Erro ao salvar agendamento: ${error.message}`)
    } else {
      toast.success(agendamento ? 'Agendamento atualizado com sucesso!' : 'Novo agendamento agendado!')
      onSaved()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          {agendamento ? 'Editar agendamento' : 'Novo agendamento'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Cliente</label>
            <select
              className="input"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              disabled={carregandoDados}
              required
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Serviço</label>
            <select
              className="input"
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              disabled={carregandoDados}
            >
              <option value="">Selecione um serviço (opcional)...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome} — R$ {Number(s.preco).toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data e hora</label>
              <input
                className="input"
                type="datetime-local"
                value={dataHoraInicio}
                onChange={(e) => setDataHoraInicio(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Valor sugerido (R$)</label>
              <input
                className="input"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as AgendamentoStatus)}
              >
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="remarcado">Reagendado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input min-h-[70px]"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Cliente tem preferência por atendimento rápido."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={salvando || carregandoDados} className="btn-primary">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}