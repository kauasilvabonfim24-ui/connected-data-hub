import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

// Interfaces para os módulos do Agente de WhatsApp
export interface AgentInput {
  empresa_id: string
  telefone: string
  mensagem: string
  nome_contato: string | null
}

export interface AgentContext {
  empresa_id: string
  telefone: string
  mensagem: string
  nome_contato: string | null
  data_hora: Date
}

export interface AgentIntents {
  preco: boolean
  horario: boolean
  agendamento: boolean
  cancelamento: boolean
  suporte: boolean
  produtos: boolean
  promocoes: boolean
  entrega: boolean
  pagamento: boolean
  pix: boolean
  atendimento_humano: boolean
  saudacoes: boolean
  desconhecido: boolean
}

export interface AgentMemoryData {
  cliente: {
    id: string
    nome: string
    total_gasto: number
    total_servicos: number
    ultima_compra_em: string | null
  } | null
  empresa: {
    nome: string
    segmento: string | null
    regras_negocio: {
      atende_sabado: boolean
      atende_domingo: boolean
      formas_pagamento: string[]
      intervalo_almoco: string | null
      realiza_entregas: boolean
      horario_funcionamento: string
      sinal_antecipado_percentual: number | null
    } | null
  } | null
  servicos: Array<{ nome: string; preco: number; duracao_minutos: number }>
  produtos: Array<{ nome: string; preco: number; estoque: number }>
  promocoes: Array<{ nome: string; mensagem: string }>
}

export interface DecisionResult {
  pode_responder: boolean
  transferir_humano: boolean
  acao_necessaria: 'nenhuma' | 'listar_precos' | 'listar_produtos' | 'listar_horarios' | 'listar_promocoes' | 'transferir_humano'
  motivo: string
}

export interface ExecutionResult {
  dados_resolvidos: {
    servicos_texto?: string
    produtos_texto?: string
    horarios_texto?: string
    promocoes_texto?: string
    regras_texto?: string
  }
}

// ----------------------------------------------------------------------------
// 1. LEITOR
// ----------------------------------------------------------------------------
export function leitor(input: AgentInput): AgentContext {
  return {
    empresa_id: input.empresa_id,
    telefone: input.telefone,
    mensagem: input.mensagem,
    nome_contato: input.nome_contato,
    data_hora: new Date()
  }
}

// ----------------------------------------------------------------------------
// 2. ANALISADOR
// ----------------------------------------------------------------------------
export function analisador(mensagem: string): AgentIntents {
  const m = mensagem.toLowerCase()

  const contemQualquer = (palavras: string[]) => palavras.some(p => m.includes(p))

  const intents: AgentIntents = {
    preco: contemQualquer(['preco', 'preço', 'quanto custa', 'valor', 'orcamento', 'orçamento', 'quanto é', 'quanto fica', 'tabela']),
    horario: contemQualquer(['horario', 'horário', 'que horas', 'funciona', 'abre', 'fecha', 'expediente', 'funcionamento', 'domingo', 'sábado', 'sabado']),
    agendamento: contemQualquer(['agendar', 'marcar', 'vaga', 'agendamento', 'marcar horario', 'marcar horário', 'disponivel', 'disponível', 'reservar']),
    cancelamento: contemQualquer(['cancelar', 'cancelamento', 'desistir', 'não vou', 'nao vou', 'desmarcar']),
    suporte: contemQualquer(['ajuda', 'suporte', 'problema', 'erro', 'não funciona', 'nao funciona', 'reclamacao', 'reclamação', 'queixa']),
    produtos: contemQualquer(['produto', 'produtos', 'estoque', 'comprar', 'catalogo', 'catálogo', 'itens', 'venda', 'tem para vender']),
    promocoes: contemQualquer(['promocao', 'promoção', 'promocoes', 'promoções', 'desconto', 'oferta', 'ofertas', 'brinde', 'cupom']),
    entrega: contemQualquer(['entrega', 'entregas', 'entregar', 'frete', 'enviar', 'motoboy', 'taxa de entrega']),
    pagamento: contemQualquer(['pagamento', 'pagar', 'cartao', 'cartão', 'dinheiro', 'forma de pagamento', 'formas de pagamento']),
    pix: contemQualquer(['pix', 'chave pix', 'pagar com pix', 'transferir']),
    atendimento_humano: contemQualquer(['humano', 'atendente', 'pessoa', 'falar com alguem', 'falar com alguém', 'gerente', 'dono', 'suporte humano', 'atendimento humano']),
    saudacoes: contemQualquer(['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'opa', 'tudo bem']),
    desconhecido: false
  }

  // Verifica se nenhuma intenção foi identificada
  const nenhumaIntencao = !Object.values(intents).some(v => v === true)
  intents.desconhecido = nenhumaIntencao

  return intents
}

// ----------------------------------------------------------------------------
// 3. MEMÓRIA
// ----------------------------------------------------------------------------
export async function memoria(
  supabase: SupabaseClient,
  context: AgentContext
): Promise<AgentMemoryData> {
  const { empresa_id, telefone } = context

  // 1. Obter Cliente
  let cliente = null
  const { data: dbCliente } = await supabase
    .from('clientes')
    .select('id, nome, total_gasto, total_servicos, ultima_compra_em')
    .eq('empresa_id', empresa_id)
    .eq('telefone', telefone)
    .maybeSingle()

  if (dbCliente) {
    cliente = dbCliente
  }

  // 2. Obter Empresa
  let empresa = null
  const { data: dbEmpresa } = await supabase
    .from('empresas')
    .select('nome, segmento, regras_negocio')
    .eq('id', empresa_id)
    .maybeSingle()

  if (dbEmpresa) {
    empresa = {
      nome: dbEmpresa.nome,
      segmento: dbEmpresa.segmento,
      regras_negocio: dbEmpresa.regras_negocio as AgentMemoryData['empresa']['regras_negocio']
    }
  }

  // 3. Obter Serviços Ativos
  const { data: dbServicos } = await supabase
    .from('servicos')
    .select('nome, preco, duracao_minutos')
    .eq('empresa_id', empresa_id)
    .eq('ativo', true)
    .order('nome')

  // 4. Obter Produtos Ativos
  const { data: dbProdutos } = await supabase
    .from('produtos')
    .select('nome, preco, estoque')
    .eq('empresa_id', empresa_id)
    .eq('ativo', true)
    .order('nome')

  // 5. Obter Campanhas Ativas / Promoções
  const { data: dbCampanhas } = await supabase
    .from('campanhas_marketing')
    .select('nome, mensagem')
    .eq('empresa_id', empresa_id)
    .eq('status', 'enviada')
    .order('criado_em', { ascending: false })
    .limit(3)

  return {
    cliente,
    empresa,
    servicos: dbServicos || [],
    produtos: dbProdutos || [],
    promocoes: dbCampanhas || []
  }
}

// ----------------------------------------------------------------------------
// 4. DECISOR
// ----------------------------------------------------------------------------
export function decisor(intents: AgentIntents, memory: AgentMemoryData): DecisionResult {
  // Regras de encaminhamento direto para Humano:
  // - Intenção explícita de falar com humano
  // - Intenção de cancelamento
  // - Intenção de suporte (problemas ou reclamações)
  if (intents.atendimento_humano) {
    return {
      pode_responder: true,
      transferir_humano: true,
      acao_necessaria: 'transferir_humano',
      motivo: 'O cliente solicitou expressamente atendimento humano.'
    }
  }

  if (intents.cancelamento) {
    return {
      pode_responder: true,
      transferir_humano: true,
      acao_necessaria: 'transferir_humano',
      motivo: 'Cancelamentos e alterações de agendamento necessitam de confirmação humana.'
    }
  }

  if (intents.suporte) {
    return {
      pode_responder: true,
      transferir_humano: true,
      acao_necessaria: 'transferir_humano',
      motivo: 'Problemas, reclamações ou suporte devem ser resolvidos por um atendente.'
    }
  }

  // Se não sabe responder à pergunta
  if (intents.desconhecido) {
    return {
      pode_responder: false,
      transferir_humano: true,
      acao_necessaria: 'transferir_humano',
      motivo: 'Mensagem desconhecida ou fora do escopo de regras configuradas.'
    }
  }

  // Decisão de ações automáticas
  if (intents.preco) {
    return {
      pode_responder: true,
      transferir_humano: false,
      acao_necessaria: 'listar_precos',
      motivo: 'Solicitação de tabela de preços e serviços.'
    }
  }

  if (intents.produtos) {
    return {
      pode_responder: true,
      transferir_humano: false,
      acao_necessaria: 'listar_produtos',
      motivo: 'Solicitação de produtos em estoque.'
    }
  }

  if (intents.agendamento || intents.horario) {
    return {
      pode_responder: true,
      transferir_humano: false,
      acao_necessaria: 'listar_horarios',
      motivo: 'Solicitação de horários ou agendamento.'
    }
  }

  if (intents.promocoes) {
    return {
      pode_responder: true,
      transferir_humano: false,
      acao_necessaria: 'listar_promocoes',
      motivo: 'Busca por promoções ou campanhas.'
    }
  }

  // Atendimento padrão (saudações, pagamentos, etc)
  return {
    pode_responder: true,
    transferir_humano: false,
    acao_necessaria: 'nenhuma',
    motivo: 'Tratamento de fluxo geral / saudação.'
  }
}

// ----------------------------------------------------------------------------
// 5. EXECUTOR
// ----------------------------------------------------------------------------
export async function executor(
  supabase: SupabaseClient,
  context: AgentContext,
  decision: DecisionResult,
  memory: AgentMemoryData
): Promise<ExecutionResult> {
  const resolved: ExecutionResult['dados_resolvidos'] = {}

  if (decision.acao_necessaria === 'listar_precos') {
    if (memory.servicos.length > 0) {
      resolved.servicos_texto = memory.servicos
        .map((s) => `• ${s.nome} — R$ ${Number(s.preco).toFixed(2).replace('.', ',')}`)
        .join('\n')
    }
  }

  if (decision.acao_necessaria === 'listar_produtos') {
    const disponiveis = memory.produtos.filter((p) => p.estoque > 0)
    const semEstoque = memory.produtos.filter((p) => p.estoque <= 0)

    let texto = ''
    if (disponiveis.length > 0) {
      texto += disponiveis
        .map((p) => `• ${p.nome} — R$ ${Number(p.preco).toFixed(2).replace('.', ',')}`)
        .join('\n')
    } else {
      texto += 'No momento não temos produtos com estoque disponível.'
    }

    if (semEstoque.length > 0) {
      texto += `\n\n(No momento sem estoque: ${semEstoque.map((p) => p.nome).join(', ')})`
    }
    resolved.produtos_texto = texto
  }

  if (decision.acao_necessaria === 'listar_horarios') {
    // Calcular horários disponíveis simulados
    const agora = new Date()
    const inicioJanela = new Date(agora)
    const fimJanela = new Date(agora)
    fimJanela.setDate(fimJanela.getDate() + 2)

    const { data: ocupados } = await supabase
      .from('agendamentos')
      .select('data_hora_inicio')
      .eq('empresa_id', context.empresa_id)
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

    resolved.horarios_texto = disponiveis.join(' e ')
  }

  if (decision.acao_necessaria === 'listar_promocoes') {
    if (memory.promocoes.length > 0) {
      resolved.promocoes_texto = memory.promocoes
        .map((c) => `🎉 ${c.nome}: ${c.mensagem}`)
        .join('\n\n')
    }
  }

  // Resolver regras gerais de negócios para contexto geral
  const regras = memory.empresa?.regras_negocio
  const m = context.mensagem.toLowerCase()

  if (regras) {
    let regrasText = ''
    if (m.includes('domingo')) {
      regrasText = regras.atende_domingo
        ? 'Sim, atendemos aos domingos! 😊'
        : 'Não atendemos aos domingos, mas funcionamos normalmente nos outros dias.'
    } else if (m.includes('sábado') || m.includes('sabado')) {
      regrasText = regras.atende_sabado
        ? 'Sim, atendemos aos sábados!'
        : 'Aos sábados não temos expediente, mas de segunda a sexta te atendemos tranquilamente.'
    } else if (m.includes('horario') || m.includes('horário') || m.includes('funcionamento') || m.includes('que horas')) {
      let msg = `Nosso horário de funcionamento é: ${regras.horario_funcionamento}.`
      if (regras.intervalo_almoco) {
        msg += ` Fazemos uma pausa para almoço das ${regras.intervalo_almoco}.`
      }
      regrasText = msg
    } else if (m.includes('pagamento') || m.includes('pagar') || m.includes('formas') || m.includes('pix')) {
      const formas = (regras.formas_pagamento || []).join(', ')
      let msg = `Aceitamos: ${formas}.`
      if (regras.sinal_antecipado_percentual) {
        msg += ` Pedimos ${regras.sinal_antecipado_percentual}% de sinal antecipado para confirmar o agendamento.`
      }
      regrasText = msg
    } else if (m.includes('entrega') || m.includes('entregam') || m.includes('frete')) {
      regrasText = regras.realiza_entregas
        ? 'Sim, fazemos entrega! Me diga o endereço que verifico direitinho.'
        : 'No momento não realizamos entregas, apenas atendimento presencial.'
    }
    resolved.regras_texto = regrasText
  }

  return { dados_resolvidos: resolved }
}

// ----------------------------------------------------------------------------
// 6. RESPONDEDOR
// ----------------------------------------------------------------------------
export function respondedor(
  context: AgentContext,
  decision: DecisionResult,
  execution: ExecutionResult,
  memory: AgentMemoryData
): string {
  const nomeCliente = memory.cliente?.nome || context.nome_contato || 'cliente'
  const nomeEmpresa = memory.empresa?.nome || 'nossa empresa'

  if (decision.transferir_humano) {
    if (context.mensagem.toLowerCase().includes('cancelar') || context.mensagem.toLowerCase().includes('desmarcar')) {
      return `Tudo bem, ${nomeCliente}. Encaminhei seu caso para o atendimento humano para que possamos ajustar ou desmarcar seu horário de forma correta. Um instante.`
    }
    return `Certo, ${nomeCliente}. Estou transferindo sua conversa para um de nossos atendentes. Por favor, aguarde um momento que já vamos te responder.`
  }

  if (decision.acao_necessaria === 'listar_precos') {
    if (execution.dados_resolvidos.servicos_texto) {
      return `Aqui estão nossos serviços e valores na ${nomeEmpresa}:\n\n${execution.dados_resolvidos.servicos_texto}\n\nQuer agendar algum deles? É só me dizer qual.`
    }
    return `No momento ainda não temos serviços cadastrados no catálogo da ${nomeEmpresa}, mas já registrei sua pergunta e alguém da nossa equipe te responde em instantes.`
  }

  if (decision.acao_necessaria === 'listar_produtos') {
    if (execution.dados_resolvidos.produtos_texto) {
      return `Nossos produtos na ${nomeEmpresa}:\n\n${execution.dados_resolvidos.produtos_texto}\n\nQuer que eu separe algum para você?`
    }
    return `No momento ainda não temos produtos cadastrados no catálogo da ${nomeEmpresa}, mas já registrei sua pergunta e alguém da nossa equipe te responde em instantes.`
  }

  if (decision.acao_necessaria === 'listar_horarios') {
    if (execution.dados_resolvidos.horarios_texto) {
      return `Olá ${nomeCliente}, tudo bem? Temos horários disponíveis ${execution.dados_resolvidos.horarios_texto}. Qual fica melhor para você?`
    }
    return `No momento não encontrei horários livres nos próximos dias, mas alguém da nossa equipe confirma um horário com você em breve.`
  }

  if (decision.acao_necessaria === 'listar_promocoes') {
    if (execution.dados_resolvidos.promocoes_texto) {
      return `Temos estas promoções ativas na ${nomeEmpresa}:\n\n${execution.dados_resolvidos.promocoes_texto}`
    }
    return 'No momento não temos nenhuma promoção ativa, mas fique de olho por aqui que avisamos assim que tiver!'
  }

  // Se houver uma regra resolvida (ex: horário de funcionamento, pix, etc)
  if (execution.dados_resolvidos.regras_texto) {
    return execution.dados_resolvidos.regras_texto
  }

  // Saudação padrão
  return `Olá, ${nomeCliente}! 👋 Como posso ajudar você hoje na ${nomeEmpresa}?\n\n💰 Preços — digite "preço"\n📦 Produtos — digite "produtos"\n📅 Agendar um serviço — digite "agendar"\n🎉 Promoções — digite "promoções"\n\nComo posso te ajudar?`
}

// ----------------------------------------------------------------------------
// FUNÇÃO EXECUTORA PRINCIPAL DO AGENTE
// ----------------------------------------------------------------------------
export async function processWhatsappAgent(
  supabase: SupabaseClient,
  input: AgentInput
): Promise<{ resposta: string; status: 'aberta' | 'aguardando_humano'; transferido: boolean }> {
  // 1. LEITOR
  const ctx = leitor(input)

  // 2. ANALISADOR
  const ints = analisador(ctx.mensagem)

  // 3. MEMÓRIA
  const mem = await memoria(supabase, ctx)

  // 4. DECISOR
  const dec = decisor(ints, mem)

  // 5. EXECUTOR
  const exe = await executor(supabase, ctx, dec, mem)

  // 6. RESPONDEDOR
  const resp = respondedor(ctx, dec, exe, mem)

  return {
    resposta: resp,
    status: dec.transferir_humano ? 'aguardando_humano' : 'aberta',
    transferido: dec.transferir_humano
  }
}