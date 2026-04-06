"use client";

import { useAssistants } from "@/contexts/AssistantsContext";
import type { AuditLog } from "@/lib/types";

const ACTION_LABELS: Record<AuditLog["action"], string> = {
  created: "Created",
  edited: "Edited",
  published: "Published",
  archived: "Archived",
  duplicated: "Duplicated",
  session_started: "Session Started",
  session_ended: "Session Ended",
};

const ACTION_COLORS: Record<AuditLog["action"], string> = {
  created: "#3498db",
  edited: "#f39c12",
  published: "#00c9af",
  archived: "#95a5a6",
  duplicated: "#9b59b6",
  session_started: "#2ecc71",
  session_ended: "#e74c3c",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function AuditPage() {
  const { auditLogs, loading } = useAssistants();

  return (
    <div className="p-8">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text-primary)", margin: "0 0 4px" }}>
        Audit Log
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif", marginBottom: 28 }}>
        Track all assistant and session actions.
      </p>

      {loading ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>Loading…</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "var(--bg-card)", borderRadius: 12,
          border: "1px dashed var(--border)",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
            No audit events yet.
          </p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-card)" }}>
                {["Time", "Action", "Entity", "Performed By"].map((h) => (
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
              {auditLogs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    background: i % 2 === 0 ? "#ffffff" : "rgba(239,235,229,0.4)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td style={{ padding: "11px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 9px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      background: `${ACTION_COLORS[log.action]}18`,
                      color: ACTION_COLORS[log.action],
                    }}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: "var(--text-primary)" }}>
                      {log.entityName}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: 11, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {log.entityType}
                    </p>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)" }}>
                    {(log as AuditLog & { user?: { name: string } }).user?.name ?? log.userId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
