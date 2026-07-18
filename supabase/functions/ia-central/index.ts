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
// Módulo PRODUTOS (pilar 3) — igual ao de serviços, mas com estoque
// ----------------------------------------------------------------------------
async function consultarProdutos(empresaId: string): Promise<string> {
  const { data: produtos } = await supabase
    .from('produtos')
    .select('nome, preco, estoque')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome')

  if (!produtos || produtos.length === 0) {
    return 'No momento ainda não temos produtos cadastrados no catálogo, mas já registrei sua pergunta e alguém da equipe te responde em instantes.'
  }
  const disponiveis = produtos.filter((p) => p.estoque > 0)
  const semEstoque = produtos.filter((p) => p.estoque <= 0)

  let msg = 'Nossos produtos disponíveis:\n\n'
  msg += disponiveis.map((p) => `• ${p.nome} — R$ ${Number(p.preco).toFixed(2).replace('.', ',')}`).join('\n')
  if (semEstoque.length > 0) {
    msg += `\n\n(No momento sem estoque: ${semEstoque.map((p) => p.nome).join(', ')})`
  }
  msg += '\n\nQuer que eu separe algum pra você?'
  return msg
}

// ----------------------------------------------------------------------------
// Módulo REGRAS DO NEGÓCIO (pilar 7)
// ----------------------------------------------------------------------------
async function consultarRegrasNegocio(empresaId: string, texto: string): Promise<string | null> {
  const { data: empresa } = await supabase
    .from('empresas')
    .select('regras_negocio')
    .eq('id', empresaId)
    .single()

  const regras = empresa?.regras_negocio
  if (!regras) return null

  if (contemAlguma(texto, ['domingo'])) {
    return regras.atende_domingo
      ? 'Sim, atendemos aos domingos! 😊'
      : 'Não atendemos aos domingos, mas funcionamos normalmente nos outros dias.'
  }
  if (contemAlguma(texto, ['sábado', 'sabado'])) {
    return regras.atende_sabado
      ? 'Sim, atendemos aos sábados!'
      : 'Aos sábados não temos expediente, mas de segunda a sexta te atendemos tranquilamente.'
  }
  if (contemAlguma(texto, ['horário de funcionamento', 'horario de funcionamento', 'que horas vocês', 'que horas voces', 'funciona', 'atende', 'vocês abrem', 'voces abrem'])) {
    let msg = `Nosso horário de funcionamento é: ${regras.horario_funcionamento}.`
    if (regras.intervalo_almoco) msg += ` Fazemos uma pausa para almoço das ${regras.intervalo_almoco}.`
    return msg
  }
  if (contemAlguma(texto, ['forma de pagamento', 'formas de pagamento', 'como pago', 'como faço o pagamento'])) {
    const formas = (regras.formas_pagamento || []).join(', ')
    let msg = `Aceitamos: ${formas}.`
    if (regras.sinal_antecipado_percentual) {
      msg += ` Pedimos ${regras.sinal_antecipado_percentual}% de sinal antecipado para confirmar o agendamento.`
    }
    return msg
  }
  if (contemAlguma(texto, ['entrega', 'entregam', 'vocês entregam', 'voces entregam'])) {
    return regras.realiza_entregas
      ? 'Sim, fazemos entrega! Me diga o endereço que verifico direitinho.'
      : 'No momento não realizamos entregas, apenas atendimento presencial.'
  }
  return null
}

// ----------------------------------------------------------------------------
// Módulo MARKETING (pilar 6) — promoções/campanhas ativas cadastradas
// ----------------------------------------------------------------------------
async function consultarPromocoes(empresaId: string): Promise<string> {
  const { data: campanhas } = await supabase
    .from('campanhas_marketing')
    .select('nome, mensagem')
    .eq('empresa_id', empresaId)
    .eq('status', 'enviada')
    .order('criado_em', { ascending: false })
    .limit(3)

  if (!campanhas || campanhas.length === 0) {
    return 'No momento não temos nenhuma promoção ativa, mas fica de olho por aqui que avisamos assim que tiver!'
  }
  const lista = campanhas.map((c) => `🎉 ${c.nome}: ${c.mensagem}`).join('\n\n')
  return `Temos essas promoções ativas:\n\n${lista}`
}

// ----------------------------------------------------------------------------
// MÓDULO IA EMPRESARIAL — decide a resposta (modo grátis, por palavra-chave)
// ----------------------------------------------------------------------------
async function gerarResposta(empresaId: string, texto: string, nomeCliente: string): Promise<string> {
  const respostaRegra = await consultarRegrasNegocio(empresaId, texto)
  if (respostaRegra) return respostaRegra

  if (contemAlguma(texto, ['produto', 'produtos', 'estoque'])) {
    return consultarProdutos(empresaId)
  }

  if (contemAlguma(texto, ['promoção', 'promocao', 'promoções', 'promocoes', 'campanha'])) {
    return consultarPromocoes(empresaId)
  }

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
    return `Olá, ${nomeCliente}! 👋 Posso te ajudar com:\n\n💰 Preços — digite "preço"\n📦 Produtos — digite "produtos"\n📅 Agendar um serviço — digite "agendar"\n🎉 Promoções — digite "promoções"\n\nComo posso te ajudar?`
  }

  return 'Recebi sua mensagem! Digite "preço" para ver nossos valores ou "agendar" para marcar um horário. Se preferir, alguém da equipe também vai te responder por aqui.'
}

// ----------------------------------------------------------------------------
// HANDLER PRINCIPAL
// ----------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json()
    const {
      empresa_id,
      canal = 'whatsapp',
      telefone,
      nome_contato,
      mensagem,
      mensagem_de_dono = false
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

    if (mensagem_de_dono) {
      if (mensagem.trim().toLowerCase() === '/ia') {
        await supabase.from('whatsapp_conversas').update({ status: 'aberta' }).eq('id', conversa.id)
        return json({ resposta: null, status: 'aberta' })
      }

      await supabase.from('whatsapp_conversas').update({ status: 'aguardando_humano' }).eq('id', conversa.id)
      await salvarMensagem(conversa.id, 'atendente', mensagem)
      return json({ resposta: null, status: 'aguardando_humano' })
    }

    await salvarMensagem(conversa.id, 'cliente', mensagem)

    if (conversa.status === 'aguardando_humano') {
      return json({ resposta: null, status: 'aguardando_humano' })
    }

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