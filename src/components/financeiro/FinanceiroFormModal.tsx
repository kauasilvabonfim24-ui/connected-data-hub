"use client";

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function FinanceiroFormModal({ open, onClose, onSaved }: Props) {
  const { empresa } = useAuth()
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago')
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().slice(0, 10))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTipo('receita')
      setDescricao('')
      setCategoria('')
      setValor('')
      setFormaPagamento('PIX')
      setStatus('pago')
      setDataTransacao(new Date().toISOString().slice(0, 10))
      setErro(null)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return
    setErro(null)

    const valorNum = Number(valor.replace(',', '.'))
    if (!descricao.trim()) {
      setErro('Informe uma descrição.')
      return
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('Informe um valor válido maior que zero.')
      return
    }

    setSalvando(true)
    const { error } = await supabase
      .from('financeiro_transacoes')
      .insert({
        empresa_id: empresa.id,
        tipo,
        descricao,
        categoria: categoria || null,
        valor: valorNum,
        forma_pagamento: formaPagamento,
        status,
        data_transacao: dataTransacao
      })

    setSalvando(false)
    if (error) {
      setErro(error.message)
    } else {
      onSaved()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Novo lançamento financeiro
        </h2>

        {erro && (
          <div className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tipo de lançamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('receita')}
                className={`py-2 text-sm font-semibold rounded-xl border transition ${
                  tipo === 'receita'
                    ? 'bg-ia-100/60 border-ia text-ia-600'
                    : 'bg-white border-surface-border text-ink-muted hover:bg-surface'
                }`}
              >
                Receita (Entrada)
              </button>
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                className={`py-2 text-sm font-semibold rounded-xl border transition ${
                  tipo === 'despesa'
                    ? 'bg-rose-50 border-rose-400 text-rose-700'
                    : 'bg-white border-surface-border text-ink-muted hover:bg-surface'
                }`}
              >
                Despesa (Saída)
              </button>
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pagamento de energia, Compra de fios"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input
                className="input"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="label">Categoria</label>
              <input
                className="input"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Infraestrutura, Vendas"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Forma de pagamento</label>
              <select
                className="input"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
              >
                <option value="PIX">PIX</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pago' | 'pendente')}
              >
                <option value="pago">Pago / Confirmado</option>
                <option value="pendente">Pendente / Em aberto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Data da transação</label>
            <input
              className="input"
              type="date"
              value={dataTransacao}
              onChange={(e) => setDataTransacao(e.target.value)}
            />
          </div>

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