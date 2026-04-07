import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AssistantForm from "@/components/assistants/AssistantForm";
import { authOptions } from "@/lib/auth";

export default async function NewAssistantPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    redirect("/assistants");
  }

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
