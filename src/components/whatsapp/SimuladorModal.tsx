"use client";

import React, { FormEvent } from 'react'
import { Sparkles } from 'lucide-react'

interface SimuladorModalProps {
  open: boolean
  nomeCliente: string
  msgSimulada: string
  setMsgSimulada: (val: string) => void
  simulando: boolean
  onClose: () => void
  onSubmit: (e: FormEvent) => void
}

export default function SimuladorModal({
  open,
  nomeCliente,
  msgSimulada,
  setMsgSimulada,
  simulando,
  onClose,
  onSubmit
}: SimuladorModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-ia" />
          <h2 className="font-display text-base font-semibold text-ink">Simular WhatsApp do Cliente</h2>
        </div>
        
        <p className="mb-4 text-xs text-ink-muted leading-relaxed">
          Digite uma mensagem como se você fosse o cliente <strong>{nomeCliente}</strong> enviando uma mensagem no WhatsApp do seu estabelecimento. Se o chat estiver sob controle da IA, ela responderá de forma autônoma!
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
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
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={simulando || !msgSimulada.trim()} className="btn-primary">
              {simulando ? 'Simulando...' : 'Enviar como Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}