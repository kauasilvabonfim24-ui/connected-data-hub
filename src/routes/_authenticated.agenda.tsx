import { createFileRoute } from "@tanstack/react-router";
import Agenda from "@/components/pages/Agenda";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: Agenda,
});
