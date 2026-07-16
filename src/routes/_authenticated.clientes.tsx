import { createFileRoute } from "@tanstack/react-router";
import Clientes from "@/components/pages/Clientes";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: Clientes,
});
