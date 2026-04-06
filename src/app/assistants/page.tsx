"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Copy, Archive, Play } from "lucide-react";
import { useAssistants } from "@/contexts/AssistantsContext";
import { useIsAdmin } from "@/hooks/useCurrentUser";
import StatusBadge from "@/components/ui/StatusBadge";
import type { AssistantStatus } from "@/lib/types";

const STATUS_TABS: { label: string; value: AssistantStatus | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Published",  value: "published" },
  { label: "Draft",      value: "draft" },
  { label: "Archived",   value: "archived" },
];

const VOICE_LABELS: Record<string, string> = {
  nova: "Nova", alloy: "Alloy", echo: "Echo",
  fable: "Fable", onyx: "Onyx", shimmer: "Shimmer",
};

const LANG_LABELS: Record<string, string> = {
  "en-US": "English (US)", "en-GB": "English (UK)",
  "es-ES": "Spanish", "fr-FR": "French",
  "de-DE": "German", "pt-BR": "Portuguese",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AssistantsPage() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { assistants, loading, duplicateAssistant, archiveAssistant } = useAssistants();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssistantStatus | "all">("all");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = assistants.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.purpose.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleArchive(id: string) {
    setActionLoading(id);
    try {
      await archiveAssistant(id);
    } finally {
      setConfirmArchiveId(null);
      setActionLoading(null);
    }
  }

  async function handleDuplicate(id: string) {
    setActionLoading(id + "-dup");
    try {
      await duplicateAssistant(id);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
            Loading assistants…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text-primary)", margin: 0 }}>
            Assistants
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif", marginTop: 4 }}>
            Create and manage your voice intake assistants.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/assistants/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8,
              background: "var(--accent-color)", color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif",
              textDecoration: "none",
            }}
          >
            <Plus size={15} />
            New Assistant
          </Link>
        )}
      </div>

      {/* Search + Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assistants..."
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 12px", fontSize: 14,
            fontFamily: "'Inter', sans-serif", color: "var(--text-primary)",
            outline: "none", width: 240,
          }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  background: active ? "var(--accent-muted)" : "transparent",
                  color: active ? "var(--accent-color)" : "var(--text-secondary)",
                  borderBottom: active ? "2px solid var(--accent-color)" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "var(--bg-card)", borderRadius: 12,
          border: "1px dashed var(--border)",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
            {search ? `No assistants matching "${search}"` : "No assistants yet. Create your first one."}
          </p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-card)" }}>
                {["Name", "Voice", "Language", "Status", "Version", "Last Updated", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                    color: "var(--text-secondary)", borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const toolList = Array.isArray(a.tools) ? a.tools as Array<{ enabled: boolean }> : [];
                const enabledCount = toolList.filter((t) => t.enabled).length;
                return (
                  <tr
                    key={a.id}
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "rgba(239,235,229,0.4)",
                      borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,201,175,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "rgba(239,235,229,0.4)")}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: "var(--text-primary)" }}>
                        {a.name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)" }}>
                        {enabledCount} tool{enabledCount !== 1 ? "s" : ""} enabled
                      </p>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)" }}>
                      {VOICE_LABELS[a.voice] ?? a.voice}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)" }}>
                      {LANG_LABELS[a.language] ?? a.language}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)" }}>
                      v{a.version}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {formatDate(a.updatedAt)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Start Session — published only */}
                        <button
                          title={a.status !== "published" ? "Only published assistants can be launched" : "Start Session"}
                          disabled={a.status !== "published"}
                          onClick={() => router.push(`/sessions/new?assistantId=${a.id}`)}
                          style={{
                            padding: "5px 10px", borderRadius: 6, border: "none",
                            background: a.status === "published" ? "var(--accent-color)" : "var(--border)",
                            color: a.status === "published" ? "#fff" : "var(--text-secondary)",
                            cursor: a.status === "published" ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                            opacity: a.status !== "published" ? 0.5 : 1,
                          }}
                        >
                          <Play size={12} /> Session
                        </button>

                        {isAdmin && (
                          <>
                            {/* Edit */}
                            <Link href={`/assistants/${a.id}/edit`} title="Edit">
                              <button style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
                                <Pencil size={14} />
                              </button>
                            </Link>

                            {/* Duplicate */}
                            <button
                              title="Duplicate"
                              disabled={actionLoading === a.id + "-dup"}
                              onClick={() => handleDuplicate(a.id)}
                              style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", display: "flex", opacity: actionLoading === a.id + "-dup" ? 0.4 : 1 }}
                            >
                              <Copy size={14} />
                            </button>

                            {/* Archive */}
                            {a.status !== "archived" && (
                              confirmArchiveId === a.id ? (
                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                  <span style={{ fontSize: 11, fontFamily: "'Inter', sans-serif", color: "var(--status-error)" }}>Archive?</span>
                                  <button
                                    onClick={() => handleArchive(a.id)}
                                    disabled={actionLoading === a.id}
                                    style={{ fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 600, color: "var(--status-error)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
                                  >
                                    {actionLoading === a.id ? "…" : "Yes"}
                                  </button>
                                  <button onClick={() => setConfirmArchiveId(null)}
                                    style={{ fontSize: 11, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button title="Archive" onClick={() => setConfirmArchiveId(a.id)}
                                  style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
                                  <Archive size={14} />
                                </button>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
