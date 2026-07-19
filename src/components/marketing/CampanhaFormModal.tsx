"use client";

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function CampanhaFormModal({ open, onClose, onSaved }: Props) {
  const { empresa } = useAuth()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('promocao')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open) {
      setNome('')
      setTipo('promocao')
      setMensagem('')
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return

    if (!nome.trim()) {
      toast.error('Informe o nome da campanha.')
      return
    }
    if (!mensagem.trim()) {
      toast.error('Escreva a mensagem da campanha.')
      return
    }

    setSalvando(true)
    const { error } = await supabase
      .from('campanhas_marketing')
      .insert({
        empresa_id: empresa.id,
        nome,
        tipo,
        mensagem,
        status: 'rascunho',
        criado_por_ia: false
      })

    setSalvando(false)
    if (error) {
      toast.error(`Erro ao salvar campanha: ${error.message}`)
    } else {
      toast.success('Rascunho de campanha de marketing criado!')
      onSaved()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Nova campanha de marketing
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome da campanha</label>
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Promoção de Natal, Recuperação de Inativos"
              required
            />
          </div>

          <div>
            <label className="label">Tipo</label>
            <select
              className="input text-sm"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="promocao">Promoção / Oferta</option>
              <option value="recuperacao">Recuperação de Clientes</option>
              <option value="informativo">Informativo / Novidades</option>
              <option value="lembrete">Lembrete geral</option>
            </select>
          </div>

          <div>
            <label className="label">Mensagem (será enviada no WhatsApp)</label>
            <textarea
              className="input min-h-[120px] text-sm"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva o texto da sua campanha aqui..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Criando...' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}