// ─── Users ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// ─── Assistants ───────────────────────────────────────────────────────────────

export type AssistantStatus = "draft" | "published" | "archived";

export type VoiceOption =
  | "nova"
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "shimmer";

export type LanguageOption =
  | "en-US"
  | "en-GB"
  | "es-ES"
  | "fr-FR"
  | "de-DE"
  | "pt-BR";

export type ToolName =
  | "appointment_lookup"
  | "insurance_check"
  | "medication_lookup"
  | "symptom_checker"
  | "escalation_trigger";

export interface AssistantTool {
  name: ToolName;
  label: string;
  description: string;
  enabled: boolean;
}

export interface Assistant {
  id: string;
  name: string;
  purpose: string;
  voice: VoiceOption;
  language: LanguageOption;
  status: AssistantStatus;
  tools: AssistantTool[];
  createdBy: string; // user id
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  version: number;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "active"
  | "completed"
  | "failed"
  | "needs_review";

export interface TranscriptEntry {
  id: string;
  sessionId: string;
  speaker: "user" | "assistant";
  content: string;
  timestamp: string;
  sequence: number;
}

export interface SessionSummary {
  overview: string;
  collectedFields: Record<string, string>;
  escalationFlags: string[];
  isDraft: true; // always true — for staff review only
}

export interface Session {
  id: string;
  assistantId: string;
  operatorId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSecs: number | null;
  turnCount: number;
  summary: SessionSummary | null;
  transcript: TranscriptEntry[];
  metadata: Record<string, unknown>;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type AuditAction =
  | "created"
  | "edited"
  | "published"
  | "archived"
  | "duplicated"
  | "session_started"
  | "session_ended";

export type AuditEntityType = "assistant" | "session";

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}
