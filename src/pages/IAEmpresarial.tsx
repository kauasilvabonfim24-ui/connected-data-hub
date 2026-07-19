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

  // Função inteligente que consulta o banco de dados e gera respostas baseadas em dados reais
  async function resolverPerguntaIA(texto: string, empresaId: string): Promise<string> {
    const m = texto.toLowerCase()

    try {
      // 1. Quanto faturei esse mês?
      if (m.includes('faturei') || m.includes('faturamento') || m.includes('ganhei') || m.includes('faturado')) {
        const hoje = new Date()
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
        
        const { data, error } = await supabase
          .from('financeiro_transacoes')
          .select('valor')
          .eq('empresa_id', empresaId)
          .eq('tipo', 'receita')
          .eq('status', 'pago')
          .gte('data_transacao', primeiroDia)

        if (error) throw error
        
        const total = (data ?? []).reduce((sum, t) => sum + Number(t.valor), 0)
        return `Neste mês, seu faturamento total foi de **${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}** (considerando apenas receitas confirmadas). Deseja fazer outro lançamento ou analisar suas despesas no menu Financeiro?`
      }

      // 2. Qual meu serviço mais vendido?
      if (m.includes('serviço mais vendido') || m.includes('mais vendido') || m.includes('servico mais vendido') || m.includes('mais procurado') || m.includes('popular')) {
        const { data, error } = await supabase
          .from('agendamentos')
          .select('servico_id, servico:servicos(nome)')
          .eq('empresa_id', empresaId)
          .neq('status', 'cancelado')

        if (error) throw error
        if (!data || data.length === 0) return 'Você ainda não possui agendamentos de serviços realizados para que eu possa analisar o mais vendido.'

        const contagem: Record<string, { nome: string; count: number }> = {}
        data.forEach((ag) => {
          const sId = ag.servico_id
          const nome = ag.servico?.nome || 'Serviço Sem Nome'
          if (sId) {
            if (!contagem[sId]) {
              contagem[sId] = { nome, count: 0 }
            }
            contagem[sId].count++
          }
        })

        const ordenado = Object.values(contagem).sort((a, b) => b.count - a.count)
        if (ordenado.length === 0) return 'Não foi possível identificar serviços agendados no momento.'

        const top = ordenado[0]
        return `O seu serviço mais vendido atualmente é o **"${top.nome}"**, com um total de **${top.count} agendamento(s)** registrados. Ele é o principal destaque do seu catálogo!`
      }

      // 3. Quem são meus melhores clientes?
      if (m.includes('melhores clientes') || m.includes('melhor cliente') || m.includes('fiéis') || m.includes('fiel') || m.includes('destaque')) {
        const { data, error } = await supabase
          .from('clientes')
          .select('nome, total_gasto, total_servicos')
          .eq('empresa_id', empresaId)
          .order('total_gasto', { ascending: false })
          .limit(3)

        if (error) throw error
        if (!data || data.length === 0) return 'Nenhum cliente cadastrado ainda no banco de dados.'

        const lista = data
          .map((c, idx) => `${idx + 1}. **${c.nome}** (Gasto total: ${Number(c.total_gasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · ${c.total_servicos} serviço(s))`)
          .join('\n')

        return `Seus top 3 melhores clientes em faturamento são:\n\n${lista}\n\nEles são os parceiros mais valiosos do seu negócio atualmente!`
      }

      // 4. Quantos clientes estão inativos?
      if (m.includes('inativos') || m.includes('inativo') || m.includes('sem comprar')) {
        const { data, error } = await supabase
          .from('clientes')
          .select('nome, ultima_compra_em')
          .eq('empresa_id', empresaId)

        if (error) throw error
        if (!data || data.length === 0) return 'Você ainda não possui clientes cadastrados para análise.'

        const noventaDiasAtras = Date.now() - 90 * 24 * 60 * 60 * 1000
        const inativos = data.filter((c) => !c.ultima_compra_em || new Date(c.ultima_compra_em).getTime() < noventaDiasAtras)

        if (inativos.length === 0) {
          return 'Excelente notícia! Você não possui nenhum cliente inativo (todos realizaram serviços nos últimos 90 dias).'
        }

        return `Atualmente, você possui **${inativos.length} cliente(s) inativo(s)** (sem novas compras nos últimos 90 dias). Que tal criar uma campanha de marketing de recuperação para reativá-los na aba **Marketing**?`
      }

      // Resposta geral context-driven
      const [countAgendamentos, countClientes, countServicos] = await Promise.all([
        supabase.from('agendamentos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('servicos').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId)
      ])

      return `Olá! Sou o **Servix IA**, seu consultor de negócios digital. Analisando sua conta, vejo que você possui **${countClientes.count ?? 0} cliente(s)**, **${countServicos.count ?? 0} serviço(s)** no catálogo e **${countAgendamentos.count ?? 0} agendamento(s)** registrados.\n\nExperimente fazer uma das perguntas sugeridas abaixo!`
    } catch (e: any) {
      return `Desculpe, tive um problema ao analisar os dados do banco: ${e.message}`
    }
  }

  async function enviarPergunta(texto: string) {
    if (!texto.trim() || !empresa?.id) return
    setEnviando(true)

    // Resolve a resposta em tempo real baseado nas métricas reais da conta
    const respostaGerada = await resolverPerguntaIA(texto, empresa.id)

    const { data, error } = await supabase
      .from('ia_interacoes')
      .insert({
        empresa_id: empresa.id,
        usuario_id: usuario?.id ?? null,
        pergunta: texto,
        resposta: respostaGerada
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
            <div key={h.id} className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5 text-sm text-white shadow-sm">
                  {h.pergunta}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-ia-100/60 px-4 py-2.5 text-sm text-ink whitespace-pre-line leading-relaxed shadow-sm">
                  {h.resposta ?? 'A IA está processando essa resposta a partir dos seus dados...'}
                </div>
              </div>
              <p className="text-center text-[10px] text-ink-soft">{formatDate(h.criado_em, true)}</p>
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