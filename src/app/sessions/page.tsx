"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { SessionsTableSkeleton } from "@/components/ui/Skeleton";

interface AssistantOption {
  id: string;
  name: string;
}

interface SessionRow {
  id: string;
  status: "active" | "completed" | "failed" | "needs_review";
  startedAt: string;
  endedAt: string | null;
  durationSecs: number | null;
  turnCount: number;
  assistant: { id: string; name: string };
  operator: { id: string; name: string | null; email: string | null };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (!mins) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [assistants, setAssistants] = useState<AssistantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assistantFilter, setAssistantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SessionRow["status"]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "duration_desc" | "duration_asc" | "turns_desc" | "turns_asc"
  >("latest");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [sessionsRes, assistantsRes] = await Promise.all([
          fetch("/api/sessions"),
          fetch("/api/assistants"),
        ]);

        const sessionsBody = await sessionsRes.json().catch(() => []);
        const assistantsBody = await assistantsRes.json().catch(() => []);

        if (!cancelled) {
          setSessions(Array.isArray(sessionsBody) ? sessionsBody : []);
          setAssistants(
            Array.isArray(assistantsBody)
              ? assistantsBody.map((item) => ({ id: item.id, name: item.name }))
              : [],
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const filteredSessions = sessions.filter((session) => {
        const searchLower = search.trim().toLowerCase();
        const matchesSearch =
          !searchLower ||
          session.assistant.name.toLowerCase().includes(searchLower) ||
          (session.operator.name || session.operator.email || "")
            .toLowerCase()
            .includes(searchLower);
        const matchesAssistant =
          assistantFilter === "all" || session.assistant.id === assistantFilter;
        const matchesStatus = statusFilter === "all" || session.status === statusFilter;
        const sessionDate = session.startedAt.slice(0, 10);
        const matchesFrom = !dateFrom || sessionDate >= dateFrom;
        const matchesTo = !dateTo || sessionDate <= dateTo;
        return matchesSearch && matchesAssistant && matchesStatus && matchesFrom && matchesTo;
      });

    return filteredSessions.sort((left, right) => {
      if (sortBy === "oldest") {
        return new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime();
      }
      if (sortBy === "duration_desc") {
        return (right.durationSecs ?? -1) - (left.durationSecs ?? -1);
      }
      if (sortBy === "duration_asc") {
        return (left.durationSecs ?? Number.MAX_SAFE_INTEGER) - (right.durationSecs ?? Number.MAX_SAFE_INTEGER);
      }
      if (sortBy === "turns_desc") {
        return right.turnCount - left.turnCount;
      }
      if (sortBy === "turns_asc") {
        return left.turnCount - right.turnCount;
      }
      return new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime();
    });
  }, [sessions, search, assistantFilter, statusFilter, dateFrom, dateTo, sortBy]);

  return (
    <div className="p-8">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Sessions
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
          >
            Review completed and active mock voice sessions.
          </p>
        </div>
        <Link
          href="/assistants"
          style={{
            textDecoration: "none",
            borderRadius: 8,
            padding: "9px 14px",
            background: "var(--accent-color)",
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Start From Assistant
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by assistant or operator"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            minWidth: 240,
            background: "var(--bg-card)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}
        />

        <select
          value={assistantFilter}
          onChange={(event) => setAssistantFilter(event.target.value)}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            background: "var(--bg-card)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}
        >
          <option value="all">All assistants</option>
          {assistants.map((assistant) => (
            <option key={assistant.id} value={assistant.id}>
              {assistant.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | SessionRow["status"])}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            background: "var(--bg-card)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="needs_review">Needs Review</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 10px",
            background: "var(--bg-card)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
          }}
        >
          <option value="latest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="duration_desc">Longest duration</option>
          <option value="duration_asc">Shortest duration</option>
          <option value="turns_desc">Most turns</option>
          <option value="turns_asc">Fewest turns</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              background: "var(--bg-card)",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              background: "var(--bg-card)",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 18, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-card)" }}>
              {["Assistant", "Started", "Duration", "Turns", "Status", "Operator", ""].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SessionsTableSkeleton rows={6} />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 24,
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                  }}
                >
                  No sessions found for current filters.
                </td>
              </tr>
            ) : (
              filtered.map((session, index) => (
                <tr
                  key={session.id}
                  style={{
                    background: index % 2 === 0 ? "#fff" : "rgba(239,235,229,0.35)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td style={{ padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {session.assistant.name}
                  </td>
                  <td style={{ padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {formatDateTime(session.startedAt)}
                  </td>
                  <td style={{ padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {formatDuration(session.durationSecs)}
                  </td>
                  <td style={{ padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {session.turnCount}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <StatusBadge status={session.status} />
                  </td>
                  <td style={{ padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                    {session.operator.name || session.operator.email || session.operator.id}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <Link
                      href={`/sessions/${session.id}`}
                      style={{
                        color: "var(--accent-color)",
                        textDecoration: "none",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

