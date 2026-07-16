import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  accent?: 'brand' | 'amber' | 'ia'
}

const accentMap = {
  brand: 'bg-brand-50 text-brand',
  amber: 'bg-amber/15 text-amber-600',
  ia: 'bg-ia-100 text-ia-600'
}

export default function StatCard({ label, value, hint, icon, accent = 'brand' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
