export default function NewAssistantPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
        New Assistant
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
        Configure a new voice intake assistant.
      </p>
      <div className="mt-8 rounded-card p-12 text-center" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
          Assistant form coming soon — Phase 2
        </p>
      </div>
    </div>
  );
}
