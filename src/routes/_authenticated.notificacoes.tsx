import { createFileRoute } from "@tanstack/react-router";
import Notificacoes from "@/components/pages/Notificacoes";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: Notificacoes,
});
