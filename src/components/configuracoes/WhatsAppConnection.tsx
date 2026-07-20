"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Smartphone, CheckCircle2, XCircle, QrCode } from 'lucide-react'

interface WhatsappInstancia {
  id: string
  empresa_id: string
  status: string | null
  numero_conectado: string | null
  qrcode_base64: string | null
}

export default function WhatsAppConnection() {
  const { empresa } = useAuth()
  const [instancia, setInstancia] = useState<WhatsappInstancia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresa?.id) return

    let ativo = true

    async function fetchInstancia() {
      if (!ativo) return
      const { data } = await supabase
        .from('whatsapp_instancias')
        .select('id, empresa_id, status, numero_conectado, qrcode_base64')
        .eq('empresa_id', empresa.id)
        .maybeSingle()
      setInstancia((data as WhatsappInstancia | null) ?? null)
      setLoading(false)
    }

    void fetchInstancia()
    const interval = setInterval(fetchInstancia, 5000)

    return () => {
      ativo = false
      clearInterval(interval)
    }
  }, [empresa?.id])

  return (
    <div className="card space-y-5 p-5">
      <div>
        <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
          <Smartphone size={18} className="text-emerald-600" />
          Conexão do WhatsApp
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Vincule o número de WhatsApp da sua empresa para que a IA possa atender seus clientes automaticamente.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-surface-border bg-surface/30 p-6 text-center text-sm text-ink-muted">
          Verificando status da conexão...
        </div>
      ) : instancia?.status === 'conectado' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              WhatsApp conectado
            </span>
          </div>
          {instancia.numero_conectado && (
            <p className="mt-3 text-sm font-semibold text-emerald-800">
              {instancia.numero_conectado}
            </p>
          )}
          <p className="mt-1 text-xs text-emerald-700/80">
            A IA está apta a receber e responder mensagens neste número.
          </p>
        </div>
      ) : instancia?.status === 'conectando' && instancia.qrcode_base64 ? (
        <div className="rounded-xl border border-surface-border bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode size={18} className="text-brand" />
            <p className="text-sm font-semibold text-ink">
              Escaneie este QR code com o WhatsApp da empresa
            </p>
          </div>
          <p className="text-xs text-ink-muted mb-4">
            Abra o WhatsApp no celular &rarr; <strong>Configurações</strong> &rarr; <strong>Aparelhos conectados</strong> &rarr; <strong>Conectar aparelho</strong>, e aponte a câmera para o código abaixo.
          </p>
          <div className="flex justify-center rounded-xl bg-surface/40 p-4">
            <img
              src={instancia.qrcode_base64}
              alt="QR code de conexão do WhatsApp"
              className="h-64 w-64 rounded-lg border border-surface-border bg-white"
            />
          </div>
          <p className="mt-3 text-center text-[10px] text-ink-soft">
            O código atualiza automaticamente a cada poucos segundos.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-amber-600" />
            <span className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
              WhatsApp não conectado
            </span>
          </div>
          <p className="mt-3 text-xs text-amber-800">
            Ainda não há uma instância ativa do WhatsApp vinculada à sua empresa. A conexão precisa ser configurada para que a IA possa atender seus clientes. Assim que a instância for iniciada, o QR code para pareamento aparecerá aqui automaticamente.
          </p>
        </div>
      )}
    </div>
  )
}