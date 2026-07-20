"use client";

import { Building } from 'lucide-react'

interface Props {
  nome: string
  setNome: (v: string) => void
  telefone: string
  setTelefone: (v: string) => void
  whatsapp: string
  setWhatsapp: (v: string) => void
  segmento: string
  setSegmento: (v: string) => void
}

export default function EmpresaForm({ nome, setNome, telefone, setTelefone, whatsapp, setWhatsapp, segmento, setSegmento }: Props) {
  return (
    <div className="card space-y-4 p-5">
      <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
        <Building size={18} className="text-brand" />
        Informações do Estabelecimento
      </h2>
      <p className="text-xs text-ink-muted mb-4">Esses dados representam as informações fundamentais da sua empresa.</p>

      <div>
        <label className="label">Nome da empresa</label>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Elétrica do Kauã" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Segmento de Atuação</label>
          <input className="input" placeholder="Ex: eletricista, mecânico, salão de beleza..." value={segmento} onChange={(e) => setSegmento(e.target.value)} />
        </div>
        <div>
          <label className="label">Telefone de Contato</label>
          <input className="input" placeholder="Ex: (11) 99999-8888" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label flex items-center gap-1.5">
          Número do WhatsApp (Simulado ou Real)
          <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand">Atendimento</span>
        </label>
        <input className="input" placeholder="Ex: +5511999998888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <p className="mt-1.5 text-xs text-ink-soft">Esse é o número de telefone que a IA monitorará para responder clientes.</p>
      </div>
    </div>
  )
}