// Elemento de assinatura visual do Servix IA: o badge "online" que representa
// o funcionário digital sempre ativo, presente no topo e nas telas de IA.
export default function AIStatusBadge({ label = 'Servix IA · online' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-ia-100 bg-ia-100/60 px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        <span className="ia-dot absolute inline-flex h-2 w-2 rounded-full bg-ia" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ia" />
      </span>
      <span className="text-xs font-semibold text-ia-600">{label}</span>
    </div>
  )
}
