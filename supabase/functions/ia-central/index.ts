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
import { processWhatsappAgent } from './whatsapp-agent.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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

    // Mensagem enviada pelo proprietário/atendente do estabelecimento
    if (mensagem_de_dono) {
      if (mensagem.trim().toLowerCase() === '/ia') {
        await supabase.from('whatsapp_conversas').update({ status: 'aberta' }).eq('id', conversa.id)
        return json({ resposta: null, status: 'aberta' })
      }

      await supabase.from('whatsapp_conversas').update({ status: 'aguardando_humano' }).eq('id', conversa.id)
      await salvarMensagem(conversa.id, 'atendente', messageClean(mensagem))
      return json({ resposta: null, status: 'aguardando_humano' })
    }

    // Registrar mensagem do cliente
    await salvarMensagem(conversa.id, 'cliente', mensagem)

    // Se a conversa já estiver aguardando atendimento humano, não responder automaticamente
    if (conversa.status === 'aguardando_humano') {
      return json({ resposta: null, status: 'aguardando_humano' })
    }

    // PROCESSAMENTO DO NOVO AGENTE DO WHATSAPP (whatsapp-agent)
    const result = await processWhatsappAgent(supabase, {
      empresa_id,
      telefone,
      mensagem,
      nome_contato: cliente.nome
    })

    // Se o agente decidir transferir para humano
    if (result.transferido) {
      await salvarMensagem(conversa.id, 'ia', result.resposta)
      await supabase.from('whatsapp_conversas').update({ status: 'aguardando_humano' }).eq('id', conversa.id)
      await supabase.from('notificacoes').insert({
        empresa_id,
        tipo: 'cliente_aguardando',
        titulo: 'Cliente precisa de atendimento humano',
        mensagem: `${cliente.nome} solicitou atendimento humano ou o agente identificou a necessidade de transição.`
      })
      return json({ resposta: result.resposta, status: 'aguardando_humano' })
    }

    // Enviar a resposta resolvida pelo respondedor do Agente
    await salvarMensagem(conversa.id, 'ia', result.resposta)
    return json({ resposta: result.resposta, status: 'aberta' })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    })
  }
})

function messageClean(msg: string): string {
  return msg || ''
}

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}