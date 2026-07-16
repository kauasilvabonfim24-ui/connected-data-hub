import { ReactNode } from 'react'

const statusStyles: Record<string, string> = {
  agendado: 'bg-brand-50 text-brand',
  confirmado: 'bg-ia-100 text-ia-600',
  em_andamento: 'bg-amber/15 text-amber-600',
  concluido: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-rose-100 text-rose-700',
  remarcado: 'bg-amber/15 text-amber-600',
  pendente: 'bg-amber/15 text-amber-600',
  pago: 'bg-emerald-100 text-emerald-700',
  atrasado: 'bg-rose-100 text-rose-700',
  rascunho: 'bg-surface text-ink-muted',
  enviada: 'bg-emerald-100 text-emerald-700',
  aberta: 'bg-brand-50 text-brand',
  fechada: 'bg-surface text-ink-muted'
}

export default function Badge({ children, status }: { children: ReactNode; status?: string }) {
  const style = (status && statusStyles[status]) || 'bg-surface text-ink-muted'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>
      {children}
    </span>
  )
}
