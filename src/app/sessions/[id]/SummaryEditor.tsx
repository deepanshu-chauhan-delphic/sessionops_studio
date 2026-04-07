"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, X, CheckCircle } from "lucide-react";

interface SummaryData {
  isDraft?: boolean;
  overview?: string;
  riskLevel?: string;
  collectedFields?: Record<string, string>;
  escalationFlags?: string[];
  recommendedActions?: string[];
  staffNotes?: string;
  reviewedAt?: string;
}

interface SummaryEditorProps {
  sessionId: string;
  summary: SummaryData;
  isAdmin: boolean;
}

const RISK_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  HIGH:     { bg: "rgba(231,76,60,0.12)",   color: "#e74c3c", border: "rgba(231,76,60,0.3)" },
  MODERATE: { bg: "rgba(243,156,18,0.12)",  color: "#f39c12", border: "rgba(243,156,18,0.3)" },
  LOW:      { bg: "rgba(0,201,175,0.1)",    color: "#00c9af", border: "rgba(0,201,175,0.25)" },
};

export default function SummaryEditor({ sessionId, summary, isAdmin }: SummaryEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [overviewDraft, setOverviewDraft] = useState(summary.overview ?? "");
  const [notesDraft, setNotesDraft] = useState(summary.staffNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = summary.isDraft !== false; // treat missing as draft
  const riskStyle = summary.riskLevel ? RISK_STYLE[summary.riskLevel] ?? RISK_STYLE.LOW : null;

  const collectedFields = summary.collectedFields ?? {};
  const escalationFlags = summary.escalationFlags ?? [];
  const recommendedActions = summary.recommendedActions ?? [];

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_summary",
          overview: overviewDraft,
          staffNotes: notesDraft,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setOverviewDraft(summary.overview ?? "");
    setNotesDraft(summary.staffNotes ?? "");
    setEditing(false);
    setError(null);
  }

  if (!summary.overview && !summary.collectedFields) {
    return (
      <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#35393f" }}>
        No summary generated for this session.
      </p>
    );
  }

  return (
    <div>
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isDraft ? (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: "#f39c12", background: "rgba(243,156,18,0.12)", border: "1px solid rgba(243,156,18,0.3)", borderRadius: 4, padding: "2px 7px" }}>
              DRAFT - For Staff Review
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: "#00c9af", background: "rgba(0,201,175,0.1)", border: "1px solid rgba(0,201,175,0.25)", borderRadius: 4, padding: "2px 7px" }}>
              <CheckCircle size={11} /> Staff Reviewed
            </span>
          )}
          {riskStyle && summary.riskLevel && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, borderRadius: 4, padding: "2px 7px", ...riskStyle }}>
              Risk: {summary.riskLevel}
            </span>
          )}
        </div>

        {isAdmin && !editing && summary.overview && (
          <button
            onClick={() => setEditing(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid #e0dcd6", background: "transparent", color: "#35393f", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <Pencil size={11} /> Edit Summary
          </button>
        )}
      </div>

      {error && (
        <p style={{ margin: "0 0 8px", fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#e74c3c" }}>{error}</p>
      )}

      {/* Overview */}
      {editing ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#35393f", marginBottom: 4 }}>
            Overview
          </label>
          <textarea
            value={overviewDraft}
            onChange={(e) => setOverviewDraft(e.target.value)}
            rows={4}
            style={{ width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, padding: "8px 10px", border: "1px solid #e0dcd6", borderRadius: 8, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      ) : (
        summary.overview && (
          <p style={{ margin: "0 0 12px", fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.6, color: "#1e2229" }}>
            {summary.overview}
          </p>
        )
      )}

      {/* Collected fields */}
      {Object.keys(collectedFields).length > 0 && (
        <>
          <h3 style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: 16 }}>Collected Fields</h3>
          {Object.entries(collectedFields).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 6, padding: "6px 10px", background: "#ffffff", borderRadius: 6, border: "1px solid #e0dcd6" }}>
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: "#35393f", textTransform: "uppercase", letterSpacing: "0.04em" }}>{key}</span>
              <p style={{ margin: "2px 0 0", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#1e2229" }}>{String(value)}</p>
            </div>
          ))}
        </>
      )}

      {/* Escalation flags */}
      {escalationFlags.length > 0 && (
        <>
          <h3 style={{ margin: "12px 0 6px", fontFamily: "var(--font-display)", fontSize: 16 }}>Escalation Flags</h3>
          {escalationFlags.map((flag) => (
            <p key={flag} style={{ margin: "0 0 4px", fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#f39c12", display: "flex", alignItems: "flex-start", gap: 4 }}>
              <span>âš‘</span><span>{flag}</span>
            </p>
          ))}
        </>
      )}

      {/* Recommended actions */}
      {recommendedActions.length > 0 && (
        <>
          <h3 style={{ margin: "12px 0 6px", fontFamily: "var(--font-display)", fontSize: 16 }}>Recommended Actions</h3>
          {recommendedActions.map((action, i) => (
            <p key={i} style={{ margin: "0 0 4px", fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#1e2229", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ color: "#00c9af", fontWeight: 700 }}>{i + 1}.</span>
              <span>{action}</span>
            </p>
          ))}
        </>
      )}

      {/* Staff notes */}
      {editing ? (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#35393f", marginBottom: 4 }}>
            Staff Notes <span style={{ fontWeight: 400, color: "#35393f" }}>(optional - clinical observations, corrections, follow-up actions)</span>
          </label>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={3}
            placeholder="Add any corrections, clinical observations, or follow-up notes here..."
            style={{ width: "100%", fontFamily: "'Inter', sans-serif", fontSize: 13, padding: "8px 10px", border: "1px solid #e0dcd6", borderRadius: 8, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      ) : (
        summary.staffNotes && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid #e0dcd6", background: "rgba(0,201,175,0.04)" }}>
            <p style={{ margin: "0 0 4px", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, color: "#35393f", textTransform: "uppercase", letterSpacing: "0.04em" }}>Staff Notes</p>
            <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#1e2229", lineHeight: 1.5 }}>{summary.staffNotes}</p>
          </div>
        )
      )}

      {/* Edit actions */}
      {editing && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "#00c9af", color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
          >
            <CheckCircle size={13} />
            {saving ? "Saving..." : "Save & Mark as Reviewed"}
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e0dcd6", background: "transparent", color: "#35393f", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <X size={13} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

