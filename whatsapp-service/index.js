const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Supabase Setup
const SUPABASE_URL = process.env.SUPABASE_URL || "https://tebccrvgokmkclnjufxr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Armazenamento das sessões ativas em memória
const sessions = {};

// Helper para sincronizar e atualizar o status de conexão no banco de dados do Supabase
async function updateStatusInDatabase(empresaId, status, phoneNumber = '') {
  if (!supabase) return;
  try {
    const { data: empresa } = await supabase
      .from('empresas')
      .select('regras_negocio')
      .eq('id', empresaId)
      .single();

    const rules = empresa?.regras_negocio || {};
    const updatedRules = {
      ...rules,
      whatsapp_conexao: {
        status,
        numero: phoneNumber || rules.whatsapp_conexao?.numero || '',
        data_conexao: status === 'Conectado' ? new Date().toISOString() : rules.whatsapp_conexao?.data_conexao || '',
        ultima_sincronizacao: new Date().toISOString()
      }
    };

    await supabase
      .from('empresas')
      .update({ 
        regras_negocio: updatedRules,
        whatsapp_numero: phoneNumber || undefined
      })
      .eq('id', empresaId);
  } catch (err) {
    console.error(`[whatsapp-service] Erro ao sincronizar status no banco para ${empresaId}:`, err);
  }
}

// Inicia ou recupera uma sessão de conexão do WhatsApp
async function startSession(empresaId) {
  if (sessions[empresaId]) {
    return sessions[empresaId];
  }

  const authFolder = path.join(__dirname, 'sessions', empresaId);
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  const session = {
    sock,
    qr: null,
    status: 'Desconectado',
    phoneNumber: ''
  };

  sessions[empresaId] = session;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.status = 'Conectando';
      try {
        session.qr = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error('[whatsapp-service] Erro ao gerar imagem do QR Code:', err);
      }
      await updateStatusInDatabase(empresaId, 'Conectando');
    }

    if (connection === 'close') {
      session.qr = null;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        console.log(`[whatsapp-service] Reconectando sessão para a empresa ${empresaId}...`);
        delete sessions[empresaId];
        await startSession(empresaId);
      } else {
        console.log(`[whatsapp-service] Sessão desconectada permanentemente para ${empresaId}`);
        session.status = 'Desconectado';
        session.phoneNumber = '';
        await updateStatusInDatabase(empresaId, 'Desconectado');
        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (e) {}
        delete sessions[empresaId];
      }
    } else if (connection === 'open') {
      session.status = 'Conectado';
      session.qr = null;
      const jid = sock.user.id;
      const cleanNumber = jid.split(':')[0] || jid.split('@')[0];
      session.phoneNumber = `+${cleanNumber}`;
      console.log(`[whatsapp-service] WhatsApp conectado para ${empresaId} no número: ${session.phoneNumber}`);
      await updateStatusInDatabase(empresaId, 'Conectado', session.phoneNumber);
    }
  });

  // Listener para capturar e responder mensagens reais recebidas pelo WhatsApp do celular
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (msg.key.fromMe) continue; // Ignora mensagens enviadas pelo próprio usuário
      if (!msg.message) continue;

      const jid = msg.key.remoteJid;
      if (!jid.endsWith('@s.whatsapp.net')) continue; // Aceita apenas chats individuais

      const text = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || 
                   '';

      const fromPhone = jid.split('@')[0];
      const pushName = msg.pushName || null;

      console.log(`[whatsapp-service] Mensagem recebida de ${fromPhone}: ${text}`);

      if (text && supabase) {
        try {
          const webhookUrl = `${SUPABASE_URL}/functions/v1/ia-central`;
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              empresa_id: empresaId,
              canal: 'whatsapp',
              telefone: fromPhone,
              nome_contato: pushName,
              mensagem: text
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.resposta && result.status === 'aberta') {
              // Envia a resposta gerada pela IA de volta ao cliente real no WhatsApp
              await sock.sendMessage(jid, { text: result.resposta });
              console.log(`[whatsapp-service] Resposta automática enviada para ${fromPhone}`);
            }
          } else {
            const errText = await response.text();
            console.error('[whatsapp-service] Erro ao enviar para ia-central:', errText);
          }
        } catch (err) {
          console.error('[whatsapp-service] Erro no envio de mensagens para a IA Central:', err);
        }
      }
    }
  });

  return session;
}

// Endpoint para gerar ou obter o QR Code ativo da sessão
app.get('/qr', async (req, res) => {
  const { empresa_id } = req.query;
  if (!empresa_id) {
    return res.status(400).json({ error: 'empresa_id é obrigatório' });
  }

  try {
    const session = await startSession(empresa_id);
    if (session.status === 'Conectado') {
      return res.json({ status: 'Conectado', qr: null, number: session.phoneNumber });
    }
    return res.json({ status: session.status, qr: session.qr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para checar status da conexão
app.get('/status', (req, res) => {
  const { empresa_id } = req.query;
  if (!empresa_id) {
    return res.status(400).json({ error: 'empresa_id é obrigatório' });
  }

  const session = sessions[empresa_id];
  if (!session) {
    return res.json({ status: 'Desconectado', qr: null });
  }

  res.json({
    status: session.status,
    qr: session.qr,
    number: session.phoneNumber
  });
});

// Endpoint para desconectar permanentemente o WhatsApp do sistema
app.post('/disconnect', async (req, res) => {
  const { empresa_id } = req.body;
  if (!empresa_id) {
    return res.status(400).json({ error: 'empresa_id é obrigatório' });
  }

  const session = sessions[empresa_id];
  if (session) {
    try {
      await session.sock.logout();
    } catch (e) {}
    delete sessions[empresa_id];
  }

  await updateStatusInDatabase(empresa_id, 'Desconectado');
  res.json({ success: true, status: 'Desconectado' });
});

app.listen(PORT, () => {
  console.log(`[whatsapp-service] Microsserviço ativo rodando na porta ${PORT}`);
});