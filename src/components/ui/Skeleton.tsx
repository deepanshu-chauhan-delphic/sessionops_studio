import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #e8e3dd 25%, #f0ebe5 50%, #e8e3dd 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function AssistantsTableSkeleton() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Skeleton width={200} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width={280} height={16} />
        </div>
        <Skeleton width={140} height={38} borderRadius={8} />
      </div>

      {/* Search + tabs skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Skeleton width={240} height={36} borderRadius={8} />
        <div style={{ display: "flex", gap: 4 }}>
          {[80, 90, 70, 90].map((w, i) => (
            <Skeleton key={i} width={w} height={32} borderRadius={6} />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 0.6fr 1fr 1.4fr",
            gap: 0,
            background: "var(--bg-card)",
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[120, 60, 80, 60, 60, 90, 40].map((w, i) => (
            <Skeleton key={i} width={w} height={12} />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 0.6fr 1fr 1.4fr",
              alignItems: "center",
              gap: 0,
              padding: "14px",
              borderBottom: rowIdx < 4 ? "1px solid var(--border)" : "none",
              background: rowIdx % 2 === 0 ? "#ffffff" : "rgba(239,235,229,0.4)",
            }}
          >
            {/* Name + tools */}
            <div>
              <Skeleton width="75%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={11} />
            </div>
            <Skeleton width="70%" height={13} />
            <Skeleton width="80%" height={13} />
            <Skeleton width={72} height={22} borderRadius={999} />
            <Skeleton width={28} height={13} />
            <Skeleton width="80%" height={13} />
            {/* Actions */}
            <div style={{ display: "flex", gap: 6 }}>
              <Skeleton width={72} height={28} borderRadius={6} />
              <Skeleton width={28} height={28} borderRadius={6} />
              <Skeleton width={28} height={28} borderRadius={6} />
              <Skeleton width={28} height={28} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SessionsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          style={{
            background: rowIdx % 2 === 0 ? "#fff" : "rgba(239,235,229,0.35)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <td style={{ padding: "14px 12px" }}><Skeleton width="80%" height={13} /></td>
          <td style={{ padding: "14px 12px" }}><Skeleton width="90%" height={13} /></td>
          <td style={{ padding: "14px 12px" }}><Skeleton width={40} height={13} /></td>
          <td style={{ padding: "14px 12px" }}><Skeleton width={28} height={13} /></td>
          <td style={{ padding: "14px 12px" }}><Skeleton width={80} height={22} borderRadius={999} /></td>
          <td style={{ padding: "14px 12px" }}><Skeleton width="70%" height={13} /></td>
          <td style={{ padding: "14px 12px" }}><Skeleton width={36} height={13} /></td>
        </tr>
      ))}
    </>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="p-8">
      {/* Back link */}
      <Skeleton width={120} height={13} style={{ marginBottom: 18 }} />

      {/* Header card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "18px 22px",
          marginBottom: 16,
        }}
      >
        <Skeleton width={200} height={28} borderRadius={8} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <Skeleton width={180} height={14} />
          <Skeleton width={80} height={22} borderRadius={999} />
        </div>
        {/* Metadata grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <Skeleton width="60%" height={13} />
          <Skeleton width="60%" height={13} />
          <Skeleton width="40%" height={13} />
          <Skeleton width="40%" height={13} />
        </div>
      </div>

      {/* Two-column content */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        {/* Transcript skeleton */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 14,
            minHeight: 280,
          }}
        >
          <Skeleton width={120} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: i % 2 === 0 ? "rgba(0,201,175,0.06)" : "rgba(53,57,63,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Skeleton width={60} height={11} />
                <Skeleton width={80} height={11} />
              </div>
              <Skeleton width={i % 3 === 0 ? "90%" : i % 3 === 1 ? "70%" : "80%"} height={13} />
            </div>
          ))}
        </div>

        {/* Summary skeleton */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={13} style={{ marginBottom: 8 }} />
          <Skeleton width="85%" height={13} style={{ marginBottom: 8 }} />
          <Skeleton width="90%" height={13} style={{ marginBottom: 20 }} />
          <Skeleton width={120} height={16} borderRadius={6} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={13} style={{ marginBottom: 6 }} />
          <Skeleton width="70%" height={13} style={{ marginBottom: 20 }} />
          <Skeleton width={100} height={16} borderRadius={6} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={80} borderRadius={8} />
        </div>
      </div>
    </div>
  );
}
