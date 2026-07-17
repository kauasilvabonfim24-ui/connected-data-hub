"use client";

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Servico } from '@/types/database'

interface Props {
  open: boolean
  servico: Servico | null
  onClose: () => void
  onSaved: () => void
}

export default function ServicoFormModal({ open, servico, onClose, onSaved }: Props) {
  const { empresa } = useAuth()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [duracao, setDuracao] = useState('60')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setNome(servico?.nome ?? '')
      setDescricao(servico?.descricao ?? '')
      setPreco(servico ? String(servico.preco) : '')
      setDuracao(servico ? String(servico.duracao_minutos) : '60')
      setAtivo(servico ? servico.ativo : true)
      setErro(null)
    }
  }, [open, servico])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return
    setErro(null)

    const precoNum = Number(preco.replace(',', '.'))
    const duracaoNum = Number(duracao)

    if (!nome.trim()) {
      setErro('Informe o nome do serviço.')
      return
    }
    if (isNaN(precoNum) || precoNum < 0) {
      setErro('Preço inválido.')
      return
    }
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      setErro('Duração inválida.')
      return
    }

    setSalvando(true)
    if (servico) {
      const { error } = await supabase
        .from('servicos')
        .update({ nome, descricao: descricao || null, preco: precoNum, duracao_minutos: duracaoNum, ativo })
        .eq('id', servico.id)
      if (error) setErro(error.message)
    } else {
      const { error } = await supabase
        .from('servicos')
        .insert({ empresa_id: empresa.id, nome, descricao: descricao || null, preco: precoNum, duracao_minutos: duracaoNum, ativo })
      if (error) setErro(error.message)
    }
    setSalvando(false)
    if (!erro) {
      onSaved()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          {servico ? 'Editar serviço' : 'Novo serviço'}
        </h2>

        {erro && (
          <div className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Instalação elétrica" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-[70px]" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preço (R$)</label>
              <input className="input" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
            <div>
              <label className="label">Duração (min)</label>
              <input className="input" value={duracao} onChange={(e) => setDuracao(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4 rounded border-surface-border" />
            Serviço ativo
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}