"use client";

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'
import type { Cliente } from '@/types/database'

interface Props {
  open: boolean
  cliente: Cliente | null
  onClose: () => void
  onSaved: () => void
}

export default function ClienteFormModal({ open, cliente, onClose, onSaved }: Props) {
  const { empresa } = useAuth()
  const [dados, setDados] = useState<Partial<Cliente>>({
    nome: '',
    telefone: '',
    whatsapp_numero: '',
    email: '',
    endereco: '',
    aniversario: '',
    origem: '',
    observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'novo' | 'editar'>('novo')

  useEffect(() => {
    if (open) {
      if (cliente) {
        setDados(cliente)
        setTipo('editar')
      } else {
        setDados({
          nome: '',
          telefone: '',
          whatsapp_numero: '',
          email: '',
          endereco: '',
          aniversario: '',
          origem: '',
          observacoes: ''
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

    const payload = {
      ...dados,
      empresa_id: empresa.id
    }

    if (tipo === 'novo') {
      const { data, error } = await supabase
        .from('clientes')
        .insert(payload)
        .select()
      
      if (error) {
        toast.error(`Erro ao criar cliente: ${error.message}`)
      } else {
        toast.success('Cliente cadastrado com sucesso!')
        onSaved()
        onClose()
      }
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', cliente?.id)
        .select()
      
      if (error) {
        toast.error(`Erro ao atualizar cliente: ${error.message}`)
      } else {
        toast.success('Cliente atualizado com sucesso!')
        onSaved()
        onClose()
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          {tipo === 'novo' ? 'Novo cliente' : 'Editar cliente'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={dados.nome || ''} onChange={(e) => setDados({...dados, nome: e.target.value})} placeholder="Nome completo" required />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={dados.telefone || ''} onChange={(e) => setDados({...dados, telefone: e.target.value})} placeholder="+55 (XX) XXXX-XXXX" required />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={dados.whatsapp_numero || ''} onChange={(e) => setDados({...dados, whatsapp_numero: e.target.value})} placeholder="Ex: (11) 99999-8888" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={dados.email || ''} onChange={(e) => setDados({...dados, email: e.target.value})} placeholder="exemplo@email.com" />
          </div>
          <div>
            <label className="label">Endereço</label>
            <textarea className="input min-h-[70px]" value={dados.endereco || ''} onChange={(e) => setDados({...dados, endereco: e.target.value})} />
          </div>
          <div>
            <label className="label">Aniversário</label>
            <input className="input" type="date" value={dados.aniversario || ''} onChange={(e) => setDados({...dados, aniversario: e.target.value})} />
          </div>
          <div>
            <label className="label">Origem</label>
            <input className="input" value={dados.origem || ''} onChange={(e) => setDados({...dados, origem: e.target.value})} placeholder="Indicação, Instagram, etc." />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[70px]" value={dados.observacoes || ''} onChange={(e) => setDados({...dados, observacoes: e.target.value})} />
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