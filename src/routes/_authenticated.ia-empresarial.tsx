import { createFileRoute } from "@tanstack/react-router";
import IAEmpresarial from "@/components/pages/IAEmpresarial";

export const Route = createFileRoute("/_authenticated/ia-empresarial")({
  component: IAEmpresarial,
});
