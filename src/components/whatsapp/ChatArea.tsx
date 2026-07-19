"use client";

import React, { FormEvent, RefObject } from 'react'
import { Send, Power, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { WhatsappConversa, WhatsappMensagem } from '@/types/database'

interface ChatAreaProps {
  ativa: WhatsappConversa
  mensagens: WhatsappMensagem[]
  novaMensagem: string
  setNovaMensagem: (val: string) => void
  enviando: boolean
  onEnviarResposta: (e: FormEvent) => void
  onAlterarStatus: (status: WhatsappConversa['status']) => void
  chatEndRef: RefObject<HTMLDivElement | null>
}

export default function ChatArea({
  ativa,
  mensagens,
  novaMensagem,
  setNovaMensagem,
  enviando,
  onEnviarResposta,
  onAlterarStatus,
  chatEndRef
}: ChatAreaProps) {
  return (
    <div className="flex flex-col bg-surface/20 overflow-hidden">
      {/* Topbar do Chat */}
      <div className="flex items-center justify-between border-b border-surface-border bg-white px-5 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-ink">{ativa.cliente?.nome ?? ativa.numero_whatsapp}</p>
          <p className="text-[11px] text-ink-soft">{ativa.numero_whatsapp}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {ativa.status !== 'aberta' && (
            <button
              onClick={() => onAlterarStatus('aberta')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ia bg-ia-100/30 px-2.5 py-1 text-xs font-semibold text-ia-600 hover:bg-ia-100/50"
              title="Permite que a IA atenda esse cliente de forma automática"
            >
              <Power size={13} />
              Ativar IA
            </button>
          )}
          {ativa.status !== 'fechada' && (
            <button
              onClick={() => onAlterarStatus('fechada')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-surface"
            >
              <Check size={13} />
              Resolver Conversa
            </button>
          )}
          {ativa.status === 'fechada' && (
            <button
              onClick={() => onAlterarStatus('aguardando_humano')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-brand hover:bg-surface"
            >
              Reabrir Chat
            </button>
          )}
        </div>
      </div>

      {/* Corpo das Mensagens */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-5 bg-dots">
        {mensagens.length === 0 && (
          <p className="text-center text-xs text-ink-soft my-10">Inicie uma conversa digitando abaixo.</p>
        )}
        {mensagens.map((m) => (
          <div key={m.id} className={`flex ${m.remetente === 'cliente' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                m.remetente === 'cliente'
                  ? 'rounded-tl-sm bg-white border border-surface-border text-ink'
                  : m.remetente === 'ia'
                  ? 'rounded-tr-sm bg-ia-100 text-ia-600 font-medium'
                  : 'rounded-tr-sm bg-brand text-white'
              }`}
            >
              {m.conteudo}
              <p className="mt-1 text-[10px] opacity-60 text-right">{formatDate(m.enviado_em, true)}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Formulário de Envio (Humano) */}
      <form onSubmit={onEnviarResposta} className="flex items-center gap-2 border-t border-surface-border bg-white p-3.5 shadow-md">
        <input
          className="input !py-3"
          placeholder="Responda como atendente (isso pausará temporariamente a IA)..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          disabled={enviando}
        />
        <button type="submit" disabled={enviando || !novaMensagem.trim()} className="btn-primary !p-3.5 shrink-0">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}