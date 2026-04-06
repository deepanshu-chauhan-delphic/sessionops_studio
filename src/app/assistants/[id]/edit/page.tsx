import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditAssistantClient from "./EditAssistantClient";
import type { Assistant } from "@/lib/types";

export default async function EditAssistantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const raw = await prisma.assistant.findUnique({ where: { id } });
  if (!raw) notFound();

  // Serialize Dates to strings for the client component
  const assistant: Assistant = {
    id: raw.id,
    name: raw.name,
    purpose: raw.purpose,
    voice: raw.voice as Assistant["voice"],
    language: raw.language as Assistant["language"],
    status: raw.status as Assistant["status"],
    tools: (raw.tools as unknown as Assistant["tools"]) ?? [],
    createdBy: raw.createdBy,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    publishedAt: raw.publishedAt ? raw.publishedAt.toISOString() : null,
    version: raw.version,
  };

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
        Edit Assistant
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif", marginBottom: 28 }}>
        Editing <strong>{assistant.name}</strong> — v{assistant.version}
      </p>

      <EditAssistantClient assistant={assistant} />
    </div>
  );
}
