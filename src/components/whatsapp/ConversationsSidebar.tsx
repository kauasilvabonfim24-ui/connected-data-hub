"use client";

import React from 'react'
import { initials } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import type { WhatsappConversa } from '@/types/database'

type FiltroStatus = 'todas' | 'aberta' | 'aguardando_humano' | 'fechada'

interface ConversationsSidebarProps {
  conversas: WhatsappConversa[]
  ativa: WhatsappConversa | null
  setAtiva: (c: WhatsappConversa) => void
  filtro: FiltroStatus
  setFiltro: (f: FiltroStatus) => void
}

export default function ConversationsSidebar({
  conversas,
  ativa,
  setAtiva,
  filtro,
  setFiltro
}: ConversationsSidebarProps) {
  return (
    <div className="flex flex-col overflow-hidden border-r border-surface-border bg-white">
      {/* Abas de Filtros */}
      <div className="grid grid-cols-4 gap-1 border-b border-surface-border p-2 bg-surface/35">
        {(['todas', 'aberta', 'aguardando_humano', 'fechada'] as FiltroStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
              filtro === f
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-muted hover:bg-surface'
            }`}
          >
            {f === 'todas' ? 'Tudo' : f === 'aberta' ? 'IA' : f === 'aguardando_humano' ? 'Op' : 'Fim'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto divide-y divide-surface-border">
        {conversas.length === 0 ? (
          <p className="p-4 text-center text-xs text-ink-soft">Nenhuma conversa encontrada neste filtro.</p>
        ) : (
          conversas.map((c) => (
            <button
              key={c.id}
              onClick={() => setAtiva(c)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface/50 ${
                ativa?.id === c.id ? 'bg-brand-50' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand">
                {initials(c.cliente?.nome ?? c.numero_whatsapp)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.cliente?.nome ?? c.numero_whatsapp}</p>
                <p className="truncate text-[11px] text-ink-soft">{c.numero_whatsapp}</p>
              </div>
              <Badge status={c.status}>
                {c.status === 'aberta' ? 'IA ativa' : c.status === 'aguardando_humano' ? 'Operador' : 'fechada'}
              </Badge>
            </button>
          ))
        )}
      </div>
    </div>
  )
}