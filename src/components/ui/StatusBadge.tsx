import type { AssistantStatus, SessionStatus } from "@/lib/types";

type BadgeStatus = AssistantStatus | SessionStatus;

const STYLES: Record<BadgeStatus, { bg: string; color: string; border: string; dot?: boolean }> = {
  draft:        { bg: "rgba(243,156,18,0.15)",  color: "#f39c12", border: "rgba(243,156,18,0.3)" },
  published:    { bg: "rgba(0,201,175,0.15)",   color: "#00c9af", border: "rgba(0,201,175,0.3)" },
  archived:     { bg: "rgba(53,57,63,0.15)",    color: "#35393f", border: "rgba(53,57,63,0.2)" },
  active:       { bg: "rgba(0,201,175,0.15)",   color: "#00c9af", border: "rgba(0,201,175,0.3)", dot: true },
  completed:    { bg: "rgba(0,201,175,0.08)",   color: "#00c9af", border: "rgba(0,201,175,0.2)" },
  failed:       { bg: "rgba(231,76,60,0.15)",   color: "#e74c3c", border: "rgba(231,76,60,0.2)" },
  needs_review: { bg: "rgba(243,156,18,0.15)",  color: "#f39c12", border: "rgba(243,156,18,0.3)" },
};

const LABELS: Record<BadgeStatus, string> = {
  draft:        "Draft",
  published:    "Published",
  archived:     "Archived",
  active:       "Active",
  completed:    "Completed",
  failed:       "Failed",
  needs_review: "Needs Review",
};

export default function StatusBadge({ status }: { status: BadgeStatus }) {
  const s = STYLES[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      {s.dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.color,
            animation: "pulse 1.5s infinite",
          }}
        />
      )}
      {LABELS[status]}
    </span>
  );
}
