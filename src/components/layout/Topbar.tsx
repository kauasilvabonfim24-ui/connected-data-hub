import { useAuth } from "@/hooks/useAuth";
import { greeting } from "@/lib/utils";
import AIStatusBadge from "./AIStatusBadge";

export default function Topbar() {
  const { usuario } = useAuth();
  const firstName = usuario?.nome?.split(" ")[0] ?? "";

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-white px-6 py-4">
      <div>
        <p className="font-display text-lg font-semibold text-ink">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}.
        </p>
        <p className="text-sm text-ink-muted">Aqui está o resumo do seu negócio hoje.</p>
      </div>
      <AIStatusBadge />
    </header>
  );
}
