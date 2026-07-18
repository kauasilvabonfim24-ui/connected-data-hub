"use client";

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Cliente } from '@/types/database'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  cliente: Cliente | null
  onClose: () => void
  onSaved: () => void
}

export default function ClienteFormModal({ open, cliente, onClose, onSaved }: Props) {
  const { empresa } = useAuth()
  const [dados, setDados] = useState<Cliente>({
    id: '',
    empresa_id: '',
    nome: '',
    telefone: '',
    whatsapp_numero: '',
    email: '',
    endereco: '',
    aniversario: '',
    origem: '',
    observacoes: '',
    total_gasto: 0,
    total_servicos: 0,
    ultima_compra_em: '',
    criado_em: '',
    atualizado_em: ''
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'novo' | 'editar'>('novo')
  const router = useRouter()

  useEffect(() => {
    if (open) {
      if (cliente) {
        setDados(cliente)
        setTipo('editar')
      } else {
        setDados({
          id: '',
          empresa_id: '',
          nome: '',
          telefone: '',
          whatsapp_numero: '',
          email: '',
          endereco: '',
          aniversario: '',
          origem: '',
          observacoes: '',
          total_gasto: 0,
          total_servicos: 0,
          ultima_compra_em: '',
          criado_em: '',
          atualizado_em: ''
        })
        setTipo('novo')
      }
    }
  }, [open, cliente])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return
    setLoading(true)
    setErro(null)

    const payload = {
      ...dados,
      empresa_id: empresa.id
    }

    if (tipo === 'novo') {
      const { data, error } = await supabase
        .from('clientes')
        .insert(payload)
        .select()
      if (error) setErro(error.message)
      else {
        if (data && data.length > 0) {
          onSaved()
          onClose()
        }
      }
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', dados.id)
        .select()
      if (error) setErro(error.message)
      else {
        if (data && data.length > 0) {
          onSaved()
          onClose()
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          {tipo === 'novo' ? 'Novo cliente' : 'Editar cliente'}
        </h2>

        {erro && (
          <div className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={dados.nome} onChange={(e) => setDados({...dados, nome: e.target.value})} placeholder="Nome completo" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={dados.telefone} onChange={(e) => setDados({...dados, telefone: e.target.value})} placeholder="+55 (XX) XXXX-XXXX" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={dados.whatsapp_numero} onChange={(e) => setDados({...dados, whatsapp_numero: e.target.value})} placeholder="Ex: (11) 99999-8888" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" value={dados.email} onChange={(e) => setDados({...dados, email: e.target.value})} placeholder="exemplo@email.com" />
          </div>
          <div>
            <label className="label">Endereço</label>
            <textarea className="input min-h-[70px]" value={dados.endereco} onChange={(e) => setDados({...dados, endereco: e.target.value})} />
          </div>
          <div>
            <label className="label">Aniversário</label>
            <input className="input" type="date" value={dados.aniversario} onChange={(e) => setDados({...dados, aniversario: e.target.value})} />
          </div>
          <div>
            <label className="label">Origem</label>
            <input className="input" value={dados.origem} onChange={(e) => setDados({...dados, origem: e.target.value})} placeholder="Indicação" />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[70px]" value={dados.observacoes} onChange={(e) => setDados({...dados, observacoes: e.target.value})} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : tipo === 'novo' ? 'Cadastrar' : 'Atualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}