import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  Wrench,
  Sparkles,
  MessageCircle,
  Megaphone,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/ia-empresarial", label: "IA Empresarial", icon: Sparkles },
  { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/marketing", label: "Marketing", icon: Megaphone },
  { to: "/notificacoes", label: "Notificações", icon: Bell },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export default function Sidebar() {
  const { usuario, empresa, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-surface-border bg-white md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-display text-base font-bold text-amber">
          S
        </div>
        <div>
          <p className="font-display text-sm font-bold leading-none text-ink">Servix IA</p>
          <p className="mt-0.5 text-[11px] leading-none text-ink-soft">
            {empresa?.nome ?? "Sua empresa"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {nav.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand" : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand">
            {usuario?.nome ? initials(usuario.nome) : "—"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{usuario?.nome ?? "Usuário"}</p>
            <p className="truncate text-xs text-ink-soft">{usuario?.role ?? ""}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-surface hover:text-ink"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
