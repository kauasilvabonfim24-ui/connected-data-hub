import { createFileRoute } from "@tanstack/react-router";
import WhatsApp from "@/components/pages/WhatsApp";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  component: WhatsApp,
});
