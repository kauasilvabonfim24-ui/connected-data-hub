// ============================================================================
// SERVIX IA — IA CENTRAL (o "cérebro" único do sistema)
// ============================================================================
// Esta função é chamada por QUALQUER canal (WhatsApp hoje, Instagram/App/Site
// no futuro). Nenhum canal tem inteligência própria — todos mandam a mensagem
// pra cá e recebem de volta o que devem responder. Isso segue a Regra Nº1 do
// Servix IA: uma IA central, reutilizada por todos os módulos.
//
// Deploy: supabase functions deploy ia-central
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

// ----------------------------------------------------------------------------
// Regras de permissão da IA (Regra do documento: SIM / NÃO)
// ----------------------------------------------------------------------------
// O que a IA PODE decidir sozinha: responder dúvidas, enviar horários, enviar
// orçamento com preço de tabela, agendar, salvar cliente, atualizar agenda.
//
// O que a IA NUNCA decide sozinha: descontos, cancelamentos, estornos,
// alteração de preço. Esses casos são sempre entregues pro empresário.
const PALAVRAS_QUE_EXIGEM_HUMANO = [
  'desconto', 'baixar o preço', 'baixar preco', 'mais barato',
  'cancelar', 'cancelamento', 'estorno', 'devolver o dinheiro', 'devolver dinheiro',
  'reclamação', 'reclamacao', 'processo', 'advogado'
]

function precisaDeHumano(texto: string): boolean {
  const t = texto.toLowerCase()
  return PALAVRAS_QUE_EXIGEM_HUMANO.some((p) => t.includes(p))
}

function contemAlguma(texto: string, palavras: string[]): boolean {
  const t = texto.toLowerCase()
  return palavras.some((p) => t.includes(p))
}

// ----------------------------------------------------------------------------
// Módulo AGENDA — calcula horários realmente disponíveis
// ----------------------------------------------------------------------------
async function calcularHorariosDisponiveis(empresaId: string): Promise<string[]> {
  const agora = new Date()
  const inicioJanela = new Date(agora)
  const fimJanela = new Date(agora)
  fimJanela.setDate(fimJanela.getDate() + 2)

  const { data: ocupados } = await supabase
    .from('agendamentos')
    .select('data_hora_inicio')
    .eq('empresa_id', empresaId)
    .neq('status', 'cancelado')
    .gte('data_hora_inicio', inicioJanela.toISOString())
    .lte('data_hora_inicio', fimJanela.toISOString())

  const ocupadosSet = new Set(
    (ocupados ?? []).map((a) => new Date(a.data_hora_inicio).toISOString().slice(0, 13))
  )

  const disponiveis: string[] = []
  for (let diaOffset = 0; diaOffset <= 2 && disponiveis.length < 2; diaOffset++) {
    const dia = new Date(agora)
    dia.setDate(dia.getDate() + diaOffset)
    for (let hora = 8; hora <= 18 && disponiveis.length < 2; hora++) {
      const slot = new Date(dia)
      slot.setHours(hora, 0, 0, 0)
      if (slot <= agora) continue
      const chave = slot.toISOString().slice(0, 13)
      if (ocupadosSet.has(chave)) continue

      const label =
        diaOffset === 0 ? 'hoje' : diaOffset === 1 ? 'amanhã' : slot.toLocaleDateString('pt-BR')
      disponiveis.push(`${label} às ${String(hora).padStart(2, '0')}:00`)
    }
  }
  return disponiveis
}

// ----------------------------------------------------------------------------
// Módulo CRM — encontra ou cria cliente
// ----------------------------------------------------------------------------
async function obterOuCriarCliente(empresaId: string, telefone: string, nomeContato: string | null) {
  const { data: existente } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('telefone', telefone)
    .maybeSingle()
  if (existente) return existente

  const { data: novo } = await supabase
    .from('clientes')
    .insert({ empresa_id: empresaId, nome: nomeContato || telefone, telefone, whatsapp_numero: telefone, origem: 'whatsapp' })
    .select()
    .single()

  if (novo) {
    await supabase.from('notificacoes').insert({
      empresa_id: empresaId,
      tipo: 'novo_cliente',
      titulo: 'Novo cliente pelo WhatsApp',
      mensagem: `${novo.nome} (${telefone}) entrou em contato pela primeira vez.`
    })
  }
  return novo
}

async function obterOuCriarConversa(empresaId: string, clienteId: string, canal: string, identificadorCanal: string) {
  const { data: existente } = await supabase
    .from('whatsapp_conversas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('numero_whatsapp', identificadorCanal)
    .maybeSingle()
  if (existente) return existente

  const { data: nova } = await supabase
    .from('whatsapp_conversas')
    .insert({ empresa_id: empresaId, cliente_id: clienteId, numero_whatsapp: identificadorCanal, status: 'aberta' })
    .select()
    .single()
  return nova
}

async function salvarMensagem(conversaId: string, remetente: 'cliente' | 'ia' | 'atendente', conteudo: string) {
  await supabase.from('whatsapp_mensagens').insert({ conversa_id: conversaId, remetente, tipo: 'texto', conteudo })
  await supabase.from('whatsapp_conversas').update({ ultima_mensagem_em: new Date().toISOString() }).eq('id', conversaId)
}

// ----------------------------------------------------------------------------
// MÓDULO IA EMPRESARIAL — decide a resposta (modo grátis, por palavra-chave)
// ----------------------------------------------------------------------------
async function gerarResposta(empresaId: string, texto: string, nomeCliente: string): Promise<string> {
  if (contemAlguma(texto, ['preço', 'preco', 'quanto custa', 'valor', 'orçamento', 'orcamento'])) {
    const { data: servicos } = await supabase
      .from('servicos').select('nome, preco').eq('empresa_id', empresaId).eq('ativo', true).order('nome')
    if (!servicos || servicos.length === 0) {
      return 'Já registrei sua solicitação de orçamento, alguém da equipe te responde em instantes.'
    }
    const lista = servicos.map((s) => `• ${s.nome} — R$ ${Number(s.preco).toFixed(2).replace('.', ',')}`).join('\n')
    return `Aqui estão nossos serviços e valores:\n\n${lista}\n\nQuer agendar algum deles? É só me dizer qual.`
  }

  if (contemAlguma(texto, ['agendar', 'marcar', 'agendamento', 'horário', 'horario', 'disponível', 'disponivel'])) {
    const horarios = await calcularHorariosDisponiveis(empresaId)
    if (horarios.length === 0) {
      return 'No momento não encontrei horários livres nos próximos dias, mas alguém da equipe confirma um horário com você em breve.'
    }
    return `Olá ${nomeCliente}, tudo bem? Temos horários disponíveis ${horarios.join(' e ')}. Qual fica melhor pra você?`
  }

  if (contemAlguma(texto, ['remarcar', 'reagendar'])) {
    return 'Sem problemas! Me diga para qual novo dia e horário você gostaria de remarcar.'
  }

  if (contemAlguma(texto, ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'])) {
    return `Olá, ${nomeCliente}! 👋 Posso te ajudar com:\n\n💰 Preços — digite "preço"\n📅 Agendar um serviço — digite "agendar"\n\nComo posso te ajudar?`
  }

  return 'Recebi sua mensagem! Digite "preço" para ver nossos valores ou "agendar" para marcar um horário. Se preferir, alguém da equipe também vai te responder por aqui.'
}

// ----------------------------------------------------------------------------
// HANDLER PRINCIPAL
// ----------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    // [DIAGNOSTICO-TEMP] Log dos headers recebidos
    console.log('[ia-central][DIAG] headers recebidos:', JSON.stringify(Object.fromEntries(req.headers.entries())))

    const body = await req.json()

    // [DIAGNOSTICO-TEMP] Log do body recebido antes da validação
    console.log('[ia-central][DIAG] body recebido:', JSON.stringify(body))

    const {
      empresa_id,
      canal = 'whatsapp',
      telefone,
      nome_contato,
      mensagem,
      mensagem_de_dono = false // true quando quem escreveu foi o próprio empresário, pelo celular dele
    } = body

    if (!empresa_id || !telefone || !mensagem) {
      return new Response(JSON.stringify({ error: 'empresa_id, telefone e mensagem são obrigatórios' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      })
    }

    const cliente = await obterOuCriarCliente(empresa_id, telefone, nome_contato ?? null)
    if (!cliente) throw new Error('Falha ao localizar/criar cliente')

    const conversa = await obterOuCriarConversa(empresa_id, cliente.id, canal, telefone)
    if (!conversa) throw new Error('Falha ao localizar/criar conversa')

    // -----------------------------------------------------------------------
    // Caso 1: mensagem do PRÓPRIO EMPRESÁRIO (assumindo a conversa manualmente)
    // -----------------------------------------------------------------------
    if (mensagem_de_dono) {
      // Comando especial pra devolver a conversa pra IA
      if (mensagem.trim().toLowerCase() === '/ia') {
        await supabase.from('whatsapp_conversas').update({ status: 'aberta' }).eq('id', conversa.id)
        return json({ resposta: null, status: 'aberta' })
      }

      // Qualquer outra mensagem manual desliga a IA nessa conversa
      await supabase.from('whatsapp_conversas').update({ status: 'aguardando_humano' }).eq('id', conversa.id)
      await salvarMensagem(conversa.id, 'atendente', mensagem)
      return json({ resposta: null, status: 'aguardando_humano' })
    }

    // -----------------------------------------------------------------------
    // Caso 2: mensagem do CLIENTE
    // -----------------------------------------------------------------------
    await salvarMensagem(conversa.id, 'cliente', mensagem)

    // Se um humano já assumiu essa conversa, a IA fica calada
    if (conversa.status === 'aguardando_humano') {
      return json({ resposta: null, status: 'aguardando_humano' })
    }

    // Regra de permissão: assuntos que a IA NUNCA decide sozinha
    if (precisaDeHumano(mensagem)) {
      const resposta = 'Um momento por favor, já te chamo alguém da nossa equipe.'
      await salvarMensagem(conversa.id, 'ia', resposta)
      await supabase.from('whatsapp_conversas').update({ status: 'aguardando_humano' }).eq('id', conversa.id)
      await supabase.from('notificacoes').insert({
        empresa_id,
        tipo: 'cliente_aguardando',
        titulo: 'Cliente precisa de atendimento humano',
        mensagem: `${cliente.nome} pediu algo que a IA não pode decidir sozinha (desconto, cancelamento etc).`
      })
      return json({ resposta, status: 'aguardando_humano' })
    }

    // Fluxo normal: a IA decide e responde
    const resposta = await gerarResposta(empresa_id, mensagem, cliente.nome)
    await salvarMensagem(conversa.id, 'ia', resposta)
    return json({ resposta, status: 'aberta' })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    })
  }
})

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}
