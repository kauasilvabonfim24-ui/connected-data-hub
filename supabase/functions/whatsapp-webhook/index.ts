import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // 1. GET Request: Handles Meta Webhook Verification Challenge
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Standard verify token or customizable via env/query parameters
    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'servix_verify_token'

    if (mode === 'subscribe' && token === verifyToken) {
      console.log("[whatsapp-webhook] Webhook verified successfully.")
      return new Response(challenge, { status: 200, headers: corsHeaders })
    }
    return new Response('Forbidden Verification Token', { status: 403 })
  }

  // 2. POST Request: Handles incoming message events from WhatsApp API providers
  try {
    const body = await req.json()
    console.log("[whatsapp-webhook] Event received:", JSON.stringify(body))

    let telefone = ""
    let mensagem = ""
    let nomeContato: string | null = null
    let metadataReceiver: string | null = null

    // Extract query parameters for multi-company isolation if provided
    const url = new URL(req.url)
    let empresaId = url.searchParams.get('empresa_id')

    // Check if the payload comes from Meta Cloud API
    if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value) {
      const value = body.entry[0].changes[0].value
      const messageObj = value.messages?.[0]
      const contactObj = value.contacts?.[0]

      if (messageObj) {
        telefone = messageObj.from
        mensagem = messageObj.text?.body || ""
        nomeContato = contactObj?.profile?.name || null
        metadataReceiver = value.metadata?.display_phone_number || null
      }
    } else {
      // Fallback for generic/custom WhatsApp Gateways (Z-API, Evolution API, Baileys, etc.)
      telefone = body.sender || body.phone || body.from || body.key?.remoteJid || ""
      mensagem = body.text?.message || body.message?.text || body.body || body.content || ""
      nomeContato = body.senderName || body.name || body.pushName || null
      metadataReceiver = body.receiver || body.instancePhoneNumber || null

      // Clean telephone string from formatting or JID identifiers
      telefone = telefone.replace("@s.whatsapp.net", "").replace("@c.us", "").trim()
    }

    if (!telefone || !mensagem) {
      return new Response(JSON.stringify({ status: "ignored", reason: "No text message payload found." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Resolve Empresa ID if not provided in search params
    if (!empresaId) {
      if (metadataReceiver) {
        // Find company by registered whatsapp number
        const cleanReceiver = metadataReceiver.replace(/\D/g, "")
        const { data: empData } = await supabase
          .from('empresas')
          .select('id')
          .filter('whatsapp_numero', 'ilike', `%${cleanReceiver}%`)
          .limit(1)
          .maybeSingle()

        if (empData) {
          empresaId = empData.id
        }
      }

      // If still not resolved, query the first active company as fallback (for testing/single-tenant deploy)
      if (!empresaId) {
        const { data: firstEmp } = await supabase.from('empresas').select('id').limit(1).maybeSingle()
        if (firstEmp) {
          empresaId = firstEmp.id
        } else {
          throw new Error("No company linked to webhook request.")
        }
      }
    }

    console.log(`[whatsapp-webhook] Processing message for company ID: ${empresaId} from ${telefone}`)

    // 3. Check WhatsApp connection status before processing response
    const { data: empresa } = await supabase
      .from('empresas')
      .select('regras_negocio')
      .eq('id', empresaId)
      .single()

    const regras = empresa?.regras_negocio as any
    const conexaoStatus = regras?.whatsapp_conexao?.status || 'Desconectado'

    if (conexaoStatus !== 'Conectado') {
      console.log(`[whatsapp-webhook] WhatsApp is ${conexaoStatus}. Automated replies are strictly disabled.`)
      return new Response(JSON.stringify({ success: true, processed: false, reason: "WhatsApp is disconnected" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 4. Forward to IA Central for processing, intent recognition, database persistence, and decision making
    const iaCentralUrl = `${supabaseUrl}/functions/v1/ia-central`
    const iaResponse = await fetch(iaCentralUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        empresa_id: empresaId,
        canal: 'whatsapp',
        telefone,
        nome_contato: nomeContato,
        mensagem
      })
    })

    if (!iaResponse.ok) {
      const errorText = await iaResponse.text()
      throw new Error(`Failed forwarding to ia-central: ${errorText}`)
    }

    const iaResult = await iaResponse.json()
    console.log("[whatsapp-webhook] IA Central reply resolution:", JSON.stringify(iaResult))

    // 5. Send the resolved automated response back to the client via WhatsApp Cloud API or custom integration
    if (iaResult.resposta && iaResult.status === 'aberta') {
      const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || regras?.whatsapp_token || ""
      const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || regras?.whatsapp_phone_id || ""

      if (accessToken && phoneId) {
        // Dispatch reply back using Meta WhatsApp Cloud API
        console.log("[whatsapp-webhook] Dispatching message via Meta Cloud API...")
        const sendResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: telefone,
            type: "text",
            text: { body: iaResult.resposta }
          })
        })

        const sendResult = await sendResponse.text()
        console.log("[whatsapp-webhook] Send result response:", sendResult)
      } else {
        console.log("[whatsapp-webhook] WhatsApp API access token or Phone Number ID not configured in database/secrets. Message response saved locally only.")
      }
    }

    return new Response(JSON.stringify({ success: true, processed: true, iaResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("[whatsapp-webhook] Webhook process error:", error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})