"use client";

import { Info, MessageSquare } from 'lucide-react'
import type { RegrasNegocio } from '@/types/database'

interface Props {
  horarioFuncionamento: string
  setHorarioFuncionamento: (v: string) => void
  intervaloAlmoco: string
  setIntervaloAlmoco: (v: string) => void
  atendeSabado: boolean
  setAtendeSabado: (v: boolean) => void
  atendeDomingo: boolean
  setAtendeDomingo: (v: boolean) => void
  realizaEntregas: boolean
  setRealizaEntregas: (v: boolean) => void
  sinalAntecipadoPercentual: string
  setSinalAntecipadoPercentual: (v: string) => void
  formasPagamento: string[]
  toggleFormaPagamento: (forma: string) => void
}

const FORMAS = ['PIX', 'Cartão', 'Dinheiro', 'Boleto']

export default function RegrasIAForm({
  horarioFuncionamento, setHorarioFuncionamento, intervaloAlmoco, setIntervaloAlmoco,
  atendeSabado, setAtendeSabado, atendeDomingo, setAtendeDomingo, realizaEntregas, setRealizaEntregas,
  sinalAntecipadoPercentual, setSinalAntecipadoPercentual, formasPagamento, toggleFormaPagamento
}: Props) {
  return (
    <div className="card space-y-5 p-5">
      <div className="flex items-start gap-3 rounded-xl border border-ia-100 bg-ia-100/20 p-4">
        <Info size={18} className="text-ia mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-ia-600">Alinhamento Inteligente do Agente de Atendimento</p>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            As regras configuradas abaixo são consumidas diretamente pela IA Central do WhatsApp. Quando os clientes perguntarem sobre horários, formas de pagamento, agendamentos aos finais de semana ou entregas, o agente formulará respostas dinâmicas baseadas estritamente nessas opções!
          </p>
        </div>
      </div>

      <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
        <MessageSquare size={18} className="text-ia" />
        Diretrizes do Robô & Escopo de Operações
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Horário de Funcionamento Geral</label>
          <input className="input" value={horarioFuncionamento} onChange={(e) => setHorarioFuncionamento(e.target.value)} placeholder="Ex: Segunda a sexta, das 08h às 18h" required />
        </div>
        <div>
          <label className="label">Intervalo de Almoço (opcional)</label>
          <input className="input" value={intervaloAlmoco} onChange={(e) => setIntervaloAlmoco(e.target.value)} placeholder="Ex: 12:00 às 13:00" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="label">Disponibilidade de Expediente</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
            <input type="checkbox" checked={atendeSabado} onChange={(e) => setAtendeSabado(e.target.checked)} className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia" />
            <div>
              <p className="text-xs font-semibold text-ink">Atende aos Sábados</p>
              <p className="text-[10px] text-ink-soft">AI responderá que funciona sab.</p>
            </div>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
            <input type="checkbox" checked={atendeDomingo} onChange={(e) => setAtendeDomingo(e.target.checked)} className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia" />
            <div>
              <p className="text-xs font-semibold text-ink">Atende aos Domingos</p>
              <p className="text-[10px] text-ink-soft">AI confirmará suporte dom.</p>
            </div>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-surface-border p-3 hover:bg-surface/35 cursor-pointer">
            <input type="checkbox" checked={realizaEntregas} onChange={(e) => setRealizaEntregas(e.target.checked)} className="h-4 w-4 rounded border-surface-border text-ia focus:ring-ia" />
            <div>
              <p className="text-xs font-semibold text-ink">Faz Entregas / Delivery</p>
              <p className="text-[10px] text-ink-soft">Habilita orçamentos de frete</p>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t border-surface-border pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Formas de Pagamento Aceitas</label>
            <p className="text-[10px] text-ink-soft mb-2">Marque todas as que você aceita para a IA informar aos clientes:</p>
            <div className="flex flex-wrap gap-2">
              {FORMAS.map((forma) => {
                const ativo = formasPagamento.includes(forma)
                return (
                  <button key={forma} type="button" onClick={() => toggleFormaPagamento(forma)} className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition ${ativo ? 'bg-ia-100/60 border-ia text-ia-600' : 'bg-white border-surface-border text-ink-muted hover:bg-surface'}`}>
                    {forma}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="label flex items-center gap-1">
              Sinal Antecipado (%)
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Opcional</span>
            </label>
            <input className="input" type="number" min="0" max="100" placeholder="Ex: 50 (sem o símbolo %)" value={sinalAntecipadoPercentual} onChange={(e) => setSinalAntecipadoPercentual(e.target.value)} />
            <p className="mt-1 text-[10px] text-ink-soft">Se preenchido, a IA pedirá esse percentual de depósito prévio para confirmar agendamentos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}