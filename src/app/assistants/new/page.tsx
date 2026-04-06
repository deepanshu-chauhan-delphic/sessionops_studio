import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AssistantForm from "@/components/assistants/AssistantForm";

export default function NewAssistantPage() {
  return (
    <div className="p-8">
      <Link
        href="/assistants"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 13, fontFamily: "'Inter', sans-serif",
          color: "var(--text-secondary)", textDecoration: "none", marginBottom: 20,
        }}
      >
        <ChevronLeft size={14} /> Back to Assistants
      </Link>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text-primary)", margin: "0 0 6px" }}>
        New Assistant
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif", marginBottom: 28 }}>
        Configure a new voice intake assistant. Save as draft to continue editing later, or publish to make it launchable.
      </p>

      <AssistantForm />
    </div>
  );
}
