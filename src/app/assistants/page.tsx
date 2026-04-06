export default function AssistantsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Assistants
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
        Create and manage your voice intake assistants.
      </p>
      <div className="mt-8 rounded-card p-12 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
          Assistant list coming soon — Phase 2
        </p>
      </div>
    </div>
  );
}
