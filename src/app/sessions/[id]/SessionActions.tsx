"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flag, CheckCircle, PhoneOff } from "lucide-react";

type SessionStatus = "active" | "completed" | "failed" | "needs_review";

interface SessionActionsProps {
  sessionId: string;
  status: SessionStatus;
  isAdmin: boolean;
}

const ACTION_CONFIG = {
  force_end: {
    label: "Force End Session",
    loadingLabel: "Ending...",
    icon: PhoneOff,
    style: {
      background: "var(--error)",
      color: "#fff",
      border: "none",
    },
    confirm: "Force-end this active session? It will be marked as failed.",
  },
  flag_review: {
    label: "Flag for Review",
    loadingLabel: "Flagging...",
    icon: Flag,
    style: {
      background: "transparent",
      color: "var(--warning)",
      border: "1px solid var(--warning)",
    },
    confirm: null,
  },
  approve: {
    label: "Approve & Close Review",
    loadingLabel: "Approving...",
    icon: CheckCircle,
    style: {
      background: "var(--accent-color)",
      color: "#fff",
      border: "none",
    },
    confirm: null,
  },
} as const;

type ActionKey = keyof typeof ACTION_CONFIG;

function getAvailableActions(status: SessionStatus): ActionKey[] {
  if (status === "active") return ["force_end"];
  if (status === "completed") return ["flag_review"];
  if (status === "needs_review") return ["approve", "flag_review"];
  return [];
}

export default function SessionActions({ sessionId, status, isAdmin }: SessionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  const actions = getAvailableActions(status);
  if (actions.length === 0) return null;

  async function doAction(action: ActionKey) {
    const config = ACTION_CONFIG[action];
    if (config.confirm && !window.confirm(config.confirm)) return;

    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      {error && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--error)",
            background: "rgba(231,76,60,0.08)",
            color: "var(--error)",
            fontSize: 13,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {actions.map((action) => {
          const cfg = ACTION_CONFIG[action];
          const Icon = cfg.icon;
          const isLoading = loading === action;
          return (
            <button
              key={action}
              onClick={() => doAction(action)}
              disabled={loading !== null}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading !== null ? "not-allowed" : "pointer",
                opacity: loading !== null && !isLoading ? 0.5 : 1,
                ...cfg.style,
              }}
            >
              <Icon size={13} />
              {isLoading ? cfg.loadingLabel : cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

