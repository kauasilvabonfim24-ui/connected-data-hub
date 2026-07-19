"use client";

import React from 'react'
import { QrCode, X, Wifi, WifiOff, ShieldCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export type ConexaoStatus = 'Conectado' | 'Desconectado' | 'Conectando' | 'Erro na conexão'

interface ConnectionPanelProps {
  statusConexao: ConexaoStatus
  numeroConectado: string
  ultimaSincronizacao: string
  qrCodeData: string
  gerandoQr: boolean
  onClose: () => void
  onIniciarConexao: () => void
  onSimularEscaneamento: () => void
  onDesconectar: () => void
}

export default function ConnectionPanel({
  statusConexao,
  numeroConectado,
  ultimaSincronizacao,
  qrCodeData,
  gerandoQr,
  onClose,
  onIniciarConexao,
  onSimularEscaneamento,
  onDesconectar
}: ConnectionPanelProps) {
  return (
    <div className="card p-5 bg-white border-brand-50 shadow-md">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-border">
        <h3 className="font-display text-base font-semibold text-ink flex items-center gap-2">
          <QrCode size={18} className="text-brand" />
          Conexão do Dispositivo WhatsApp
        </h3>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Status Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
              statusConexao === 'Conectado' ? 'bg-ia-100 text-ia-600' :
              statusConexao === 'Conectando' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                statusConexao === 'Conectado' ? 'bg-ia' :
                statusConexao === 'Conectando' ? 'bg-amber' : 'bg-rose-600'
              }`} />
            </span>
            <div>
              <p className="text-xs text-ink-soft leading-none">Estado de Conexão</p>
              <p className="text-sm font-semibold text-ink mt-0.5">{statusConexao}</p>
            </div>
          </div>

          {statusConexao === 'Conectado' && (
            <>
              <div className="grid grid-cols-2 gap-4 bg-surface/50 p-3 rounded-xl border border-surface-border">
                <div>
                  <p className="text-[10px] text-ink-soft">Número Conectado</p>
                  <p className="text-xs font-semibold text-ink mt-0.5">{numeroConectado}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-soft">Sincronizado em</p>
                  <p className="text-xs font-semibold text-ink mt-0.5">{formatDate(ultimaSincronizacao || new Date(), true)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-ia-600 bg-ia-100/20 p-2.5 rounded-xl border border-ia-100/50">
                <ShieldCheck size={14} className="shrink-0" />
                Respostas automáticas do robô estão ativas e monitorando as mensagens.
              </div>
            </>
          )}

          {statusConexao !== 'Conectado' && (
            <p className="text-xs text-ink-muted leading-relaxed">
              Conecte seu celular para que o Servix IA possa ler e responder às mensagens dos seus clientes no WhatsApp. Caso esteja desconectado, o robô suspenderá todos os envios automáticos imediatamente.
            </p>
          )}

          <div className="flex gap-2">
            {statusConexao === 'Desconectado' && (
              <button onClick={onIniciarConexao} disabled={gerandoQr} className="btn-primary !py-2 !text-xs">
                Gerar QR Code de Conexão
              </button>
            )}
            {statusConexao === 'Conectando' && (
              <button onClick={onSimularEscaneamento} className="btn-primary !py-2 !text-xs !bg-ia hover:!bg-ia-600">
                Simular Escaneamento (Conectar)
              </button>
            )}
            {statusConexao !== 'Desconectado' && (
              <button onClick={onDesconectar} className="btn-secondary !py-2 !text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                Desconectar Aparelho
              </button>
            )}
          </div>
        </div>

        {/* QR Code display area */}
        <div className="flex flex-col items-center justify-center p-4 bg-surface/35 rounded-2xl border border-surface-border border-dashed min-h-[220px]">
          {statusConexao === 'Conectando' && qrCodeData ? (
            <div className="text-center space-y-3">
              <img src={qrCodeData} alt="WhatsApp Connection QR Code" className="w-40 h-40 object-contain rounded-lg border bg-white p-1" />
              <p className="text-[10px] text-ink-soft font-mono">Escaneie o código acima usando o WhatsApp Web</p>
            </div>
          ) : statusConexao === 'Conectado' ? (
            <div className="text-center space-y-2 text-ia-600">
              <Wifi size={32} className="mx-auto text-ia animate-pulse" />
              <p className="text-xs font-semibold">Seu WhatsApp está emparelhado!</p>
              <p className="text-[10px] text-ink-soft">Atendimento automatizado 24h em execução.</p>
            </div>
          ) : (
            <div className="text-center space-y-2 text-ink-soft">
              <WifiOff size={32} className="mx-auto" />
              <p className="text-xs">Aparelho Desconectado</p>
              <p className="text-[10px]">Gere um novo código QR para conectar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}