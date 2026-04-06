"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssistants } from "@/contexts/AssistantsContext";
import { AVAILABLE_TOOLS, VOICE_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/mock-data";
import type { Assistant, AssistantTool, ToolName, VoiceOption, LanguageOption } from "@/lib/types";

interface AssistantFormProps {
  assistant?: Assistant; // undefined = create mode
}

const INPUT_STYLE = {
  width: "100%",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  color: "var(--text-primary)",
  outline: "none",
};

const LABEL_STYLE = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "'Inter', sans-serif",
  color: "var(--text-secondary)",
  marginBottom: 6,
};

export default function AssistantForm({ assistant }: AssistantFormProps) {
  const router = useRouter();
  const { createAssistant, updateAssistant, publishAssistant } = useAssistants();

  const [name, setName] = useState(assistant?.name ?? "");
  const [purpose, setPurpose] = useState(assistant?.purpose ?? "");
  const [voice, setVoice] = useState<VoiceOption>(assistant?.voice ?? "nova");
  const [language, setLanguage] = useState<LanguageOption>(assistant?.language ?? "en-US");
  const [tools, setTools] = useState<AssistantTool[]>(
    assistant?.tools ??
      AVAILABLE_TOOLS.map((t) => ({ ...t, enabled: false }))
  );
  const [errors, setErrors] = useState<{ name?: string; purpose?: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!purpose.trim()) e.purpose = "Purpose / instructions are required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleTool(toolName: ToolName) {
    setTools((prev) =>
      prev.map((t) => (t.name === toolName ? { ...t, enabled: !t.enabled } : t))
    );
  }

  async function handleSaveDraft() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      if (assistant) {
        await updateAssistant(assistant.id, { name, purpose, voice, language, tools });
      } else {
        await createAssistant({ name, purpose, voice, language, tools }, false);
      }
      router.push("/assistants");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      if (assistant) {
        await updateAssistant(assistant.id, { name, purpose, voice, language, tools });
        if (assistant.status !== "published") {
          await publishAssistant(assistant.id);
        }
      } else {
        await createAssistant({ name, purpose, voice, language, tools }, true);
      }
      router.push("/assistants");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to publish.");
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {apiError && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: "rgba(231,76,60,0.08)", border: "1px solid var(--status-error)",
          fontSize: 13, fontFamily: "'Inter', sans-serif", color: "var(--status-error)",
        }}>
          {apiError}
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL_STYLE}>Assistant Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pre-Visit Intake"
          style={{ ...INPUT_STYLE, borderColor: errors.name ? "var(--status-error)" : "var(--border)" }}
        />
        {errors.name && (
          <p style={{ fontSize: 12, color: "var(--status-error)", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>{errors.name}</p>
        )}
      </div>

      {/* Purpose */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL_STYLE}>Purpose / Instructions *</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Describe what this assistant should do, what it should collect, and any constraints..."
          rows={5}
          style={{ ...INPUT_STYLE, resize: "vertical", borderColor: errors.purpose ? "var(--status-error)" : "var(--border)" }}
        />
        {errors.purpose && (
          <p style={{ fontSize: 12, color: "var(--status-error)", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>{errors.purpose}</p>
        )}
      </div>

      {/* Voice + Language */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={LABEL_STYLE}>Voice</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value as VoiceOption)} style={INPUT_STYLE}>
            {VOICE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE}>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value as LanguageOption)} style={INPUT_STYLE}>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tools */}
      <div style={{ marginBottom: 28 }}>
        <label style={LABEL_STYLE}>Approved Tools</label>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {tools.map((tool, i) => (
            <label
              key={tool.name}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={tool.enabled}
                onChange={() => toggleTool(tool.name)}
                style={{ marginTop: 2, accentColor: "var(--accent-color)", width: 15, height: 15 }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", color: "var(--text-primary)", margin: 0 }}>
                  {tool.label}
                </p>
                <p style={{ fontSize: 12, fontFamily: "'Inter', sans-serif", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                  {tool.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => router.push("/assistants")}
          disabled={saving}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "1px solid var(--accent-color)",
            background: "transparent",
            color: "var(--accent-color)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? "Saving…" : "Save as Draft"}
        </button>
        <button
          onClick={handlePublish}
          disabled={saving}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-color)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? "Saving…" : (assistant?.status === "published" ? "Save & Keep Published" : "Publish")}
        </button>
      </div>
    </div>
  );
}
