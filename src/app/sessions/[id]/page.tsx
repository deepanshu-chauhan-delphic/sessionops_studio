export default function SessionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Session Detail
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
        Session <code>{params.id}</code>
      </p>
      <div className="mt-8 rounded-card p-12 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
          Session transcript &amp; summary coming soon — Phase 4
        </p>
      </div>
    </div>
  );
}
