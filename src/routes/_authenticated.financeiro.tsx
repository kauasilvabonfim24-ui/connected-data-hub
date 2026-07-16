import { createFileRoute } from "@tanstack/react-router";
import Financeiro from "@/components/pages/Financeiro";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: Financeiro,
});
