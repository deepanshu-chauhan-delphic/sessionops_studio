export default function AuditPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Audit Log
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
        Track all assistant and session actions.
      </p>
      <div className="mt-8 rounded-card p-12 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
          Audit log coming soon — Phase 2
        </p>
      </div>
    </div>
  );
}
