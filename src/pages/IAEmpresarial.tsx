import { FormEvent, useEffect, useRef, useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import AIStatusBadge from '@/components/layout/AIStatusBadge'
import type { IaInteracao } from '@/types/database'

const PERGUNTAS_SUGERIDAS = [
  'Quanto faturei esse mês?',
  'Qual meu serviço mais vendido?',
  'Quem são meus melhores clientes?',
  'Quantos clientes estão inativos?'
]

export default function IAEmpresarial() {
  const { empresa, usuario } = useAuth()
  const [historico, setHistorico] = useState<IaInteracao[]>([])
  const [pergunta, setPergunta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!empresa?.id) return
    void loadHistorico(empresa.id)
  }, [empresa?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historico])

  async function loadHistorico(empresaId: string) {
    const { data } = await supabase
      .from('ia_interacoes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: true })
      .limit(50)
    setHistorico((data as IaInteracao[]) ?? [])
  }

  async function enviarPergunta(texto: string) {
    if (!texto.trim() || !empresa?.id) return
    setEnviando(true)

    // NOTA: aqui entra a chamada para a Edge Function que consulta o banco
    // e gera a resposta real via IA. Por enquanto, registramos a pergunta
    // e deixamos a resposta pendente de implementação do backend de IA.
    const { data, error } = await supabase
      .from('ia_interacoes')
      .insert({
        empresa_id: empresa.id,
        usuario_id: usuario?.id ?? null,
        pergunta: texto,
        resposta: null
      })
      .select()
      .single()

    if (!error && data) {
      setHistorico((prev) => [...prev, data as IaInteracao])
    }
    setPergunta('')
    setEnviando(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await enviarPergunta(pergunta)
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">IA Empresarial</h1>
          <p className="text-sm text-ink-muted">Converse com a IA sobre o seu negócio.</p>
        </div>
        <AIStatusBadge />
      </div>

      <div className="card flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {historico.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ia-100 text-ia-600">
                <Sparkles size={20} />
              </div>
              <p className="font-display text-base font-semibold text-ink">Pergunte algo sobre seu negócio</p>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">Experimente uma das perguntas abaixo pra começar.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {PERGUNTAS_SUGERIDAS.map((p) => (
                  <button key={p} onClick={() => enviarPergunta(p)} className="btn-secondary !py-1.5 !text-xs">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {historico.map((h) => (
            <div key={h.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-sm text-white">
                  {h.pergunta}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-ia-100/60 px-4 py-2.5 text-sm text-ink">
                  {h.resposta ?? 'A IA está processando essa resposta a partir dos seus dados...'}
                </div>
              </div>
              <p className="text-center text-[11px] text-ink-soft">{formatDate(h.criado_em, true)}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-surface-border p-3">
          <input
            className="input"
            placeholder="Pergunte algo, ex: quanto faturei esse mês?"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
          />
          <button type="submit" disabled={enviando} className="btn-primary !px-3.5">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
