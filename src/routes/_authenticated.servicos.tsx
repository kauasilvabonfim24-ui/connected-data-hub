import { createFileRoute } from "@tanstack/react-router";
import Servicos from "@/components/pages/Servicos";

export const Route = createFileRoute("/_authenticated/servicos")({
  component: Servicos,
});
