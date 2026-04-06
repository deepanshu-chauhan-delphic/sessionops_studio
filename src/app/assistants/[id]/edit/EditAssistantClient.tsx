"use client";

import { useAssistants } from "@/contexts/AssistantsContext";
import AssistantForm from "@/components/assistants/AssistantForm";
import type { Assistant } from "@/lib/types";

// Uses live context state so edits reflect latest in-memory version,
// falls back to the server-passed assistant if not found in context yet.
export default function EditAssistantClient({ assistant }: { assistant: Assistant }) {
  const { assistants } = useAssistants();
  const live = assistants.find((a) => a.id === assistant.id) ?? assistant;
  return <AssistantForm assistant={live} />;
}
