import { createFileRoute } from "@tanstack/react-router";
import Marketing from "@/components/pages/Marketing";

export const Route = createFileRoute("/_authenticated/marketing")({
  component: Marketing,
});
