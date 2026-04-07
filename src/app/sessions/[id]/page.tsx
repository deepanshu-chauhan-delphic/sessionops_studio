import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/ui/StatusBadge";
import SessionActions from "./SessionActions";
import SummaryEditor from "./SummaryEditor";

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [authSession, session] = await Promise.all([
    getServerSession(authOptions),
    prisma.session.findUnique({
      where: { id },
      include: {
        assistant: { select: { id: true, name: true, status: true } },
        operator: { select: { id: true, name: true, email: true } },
        transcript: { orderBy: { sequence: "asc" } },
      },
    }),
  ]);

  if (!session) notFound();

  const isAdmin = authSession?.user?.role === "admin";

  const summary = asRecord(session.summary);
  const collectedFields = asRecord(summary.collectedFields);
  const escalationFlags = Array.isArray(summary.escalationFlags)
    ? summary.escalationFlags.filter((flag) => typeof flag === "string")
    : [];
  const recommendedActions = Array.isArray(summary.recommendedActions)
    ? summary.recommendedActions.filter((a) => typeof a === "string")
    : [];
  const metadata = asRecord(session.metadata);

  return (
    <div className="p-8">
      <Link
        href="/sessions"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          color: "var(--text-secondary)",
          textDecoration: "none",
          marginBottom: 18,
        }}
      >
        <ChevronLeft size={14} /> Back to Sessions
      </Link>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "18px 22px",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 28 }}>
          Session Detail
        </h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
            Assistant: <strong>{session.assistant.name}</strong>
          </p>
          <StatusBadge status={session.status} />
        </div>

        {session.status === "needs_review" && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--warning)",
              background: "rgba(243,156,18,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, fontFamily: "'Inter', sans-serif", color: "var(--warning)", fontWeight: 600 }}>
              ⚑ Flagged for Review
            </span>
            <span style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--warning)" }}>
              - A staff member flagged this session. Review the transcript and summary below before approving.
            </span>
          </div>
        )}

        <SessionActions
          sessionId={session.id}
          status={session.status}
          isAdmin={isAdmin}
        />

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
          <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
            Started: {formatDateTime(session.startedAt)}
          </p>
          <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
            Ended: {formatDateTime(session.endedAt)}
          </p>
          <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
            Duration: {session.durationSecs ?? 0}s
          </p>
          <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
            Turns: {session.turnCount}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 14,
            minHeight: 280,
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 20 }}>Transcript</h2>
          {session.transcript.length === 0 ? (
            <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>
              No transcript entries were captured.
            </p>
          ) : (
            session.transcript.map((line) => (
              <div
                key={line.id}
                style={{
                  marginBottom: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: line.speaker === "assistant" ? "rgba(0,201,175,0.08)" : "rgba(53,57,63,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                  }}
                >
                  <strong>{line.speaker === "assistant" ? "Assistant" : "User"}</strong>
                  <span style={{ color: "var(--text-secondary)" }}>{formatDateTime(line.timestamp)}</span>
                </div>
                <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>{line.content}</p>
              </div>
            ))
          )}
        </section>

        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 20 }}>Summary</h2>
          <SummaryEditor
            sessionId={session.id}
            summary={{
              isDraft: typeof summary.isDraft === "boolean" ? summary.isDraft : true,
              overview: typeof summary.overview === "string" ? summary.overview : undefined,
              riskLevel: typeof summary.riskLevel === "string" ? summary.riskLevel : undefined,
              collectedFields: collectedFields as Record<string, string>,
              escalationFlags,
              recommendedActions,
              staffNotes: typeof summary.staffNotes === "string" ? summary.staffNotes : undefined,
              reviewedAt: typeof summary.reviewedAt === "string" ? summary.reviewedAt : undefined,
            }}
            isAdmin={isAdmin}
          />

          <h3 style={{ margin: "16px 0 6px", fontFamily: "var(--font-display)", fontSize: 16 }}>
            Metadata
          </h3>
          <pre
            style={{
              margin: 0,
              fontSize: 11,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
            }}
          >
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}



