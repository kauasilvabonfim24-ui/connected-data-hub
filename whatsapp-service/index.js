require('dotenv').config()
const express = require('express')
const QRCode = require('qrcode')
const pino = require('pino')
const { createClient } = require('@supabase/supabase-js')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EMPRESA_ID, PORT = 3000 } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !EMPRESA_ID) {
  console.error('Faltam variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EMPRESA_ID')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const IA_CENTRAL_URL = `${SUPABASE_URL}/functions/v1/ia-central`

async function atualizarInstancia(dados) {
  await supabase.from('whatsapp_instancias').upsert(
    { empresa_id: EMPRESA_ID, instance_name: 'render-baileys', ...dados },
    { onConflict: 'empresa_id' }
  )
}

async function chamarIACentral(payload) {
  const res = await fetch(IA_CENTRAL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
    body: JSON.stringify(payload)
  })
  return res.json()
}

async function iniciarWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessao')
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      const qrcodeBase64 = await QRCode.toDataURL(qr)
      await atualizarInstancia({ qrcode_base64: qrcodeBase64, status: 'conectando' })
      console.log('📱 QR code gerado.')
    }
    if (connection === 'open') {
      const numero = sock.user?.id?.split(':')[0] ?? null
      await atualizarInstancia({ status: 'conectado', qrcode_base64: null, numero_conectado: numero })
      console.log('✅ WhatsApp conectado.')
    }
    if (connection === 'close') {
      const motivo = lastDisconnect?.error?.output?.statusCode
      const deveReconectar = motivo !== DisconnectReason.loggedOut
      await atualizarInstancia({ status: 'desconectado' })
      if (deveReconectar) iniciarWhatsapp()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return
    if (msg.key.remoteJid?.endsWith('@g.us')) return
    if (msg.key.remoteJid === 'status@broadcast') return

    const souEuMandando = msg.key.fromMe === true
    const telefoneCliente = msg.key.remoteJid.replace('@s.whatsapp.net', '')
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    if (!texto) return

    const { resposta } = await chamarIACentral({
      empresa_id: EMPRESA_ID,
      canal: 'whatsapp',
      telefone: telefoneCliente,
      nome_contato: msg.pushName ?? null,
      mensagem: texto,
      mensagem_de_dono: souEuMandando
    })

    if (resposta && !souEuMandando) {
      await sock.sendMessage(msg.key.remoteJid, { text: resposta })
    }
  })
}

iniciarWhatsapp()

const app = express()
app.get('/health', (req, res) => res.status(200).send('ok'))
app.listen(PORT, () => console.log(`Health check na porta ${PORT}`))