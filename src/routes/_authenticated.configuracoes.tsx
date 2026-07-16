import { createFileRoute } from "@tanstack/react-router";
import Configuracoes from "@/components/pages/Configuracoes";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});
