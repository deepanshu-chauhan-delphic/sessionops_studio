import type {
  User,
  Assistant,
  Session,
  TranscriptEntry,
  AuditLog,
} from "./types";

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: "u-001",
    email: "admin@miihealth.com",
    name: "Alex Johnson",
    role: "admin",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "u-002",
    email: "viewer@miihealth.com",
    name: "Sarah Chen",
    role: "viewer",
    createdAt: "2026-01-15T09:30:00Z",
  },
];

export const CURRENT_USER = MOCK_USERS[0]; // Admin by default for mock

// ─── Assistants ───────────────────────────────────────────────────────────────

export const MOCK_ASSISTANTS: Assistant[] = [
  {
    id: "a-001",
    name: "Pre-Visit Intake",
    purpose:
      "Collect patient intake information before their appointment. Ask for full name, date of birth, reason for visit, current medications, known allergies, and insurance provider. Be warm and professional. Do not provide medical advice.",
    voice: "nova",
    language: "en-US",
    status: "published",
    tools: [
      {
        name: "appointment_lookup",
        label: "Appointment Lookup",
        description: "Verify upcoming appointments for the patient",
        enabled: true,
      },
      {
        name: "insurance_check",
        label: "Insurance Check",
        description: "Verify insurance coverage status",
        enabled: true,
      },
      {
        name: "escalation_trigger",
        label: "Escalation Trigger",
        description: "Flag session for staff review when risk conditions are met",
        enabled: true,
      },
    ],
    createdBy: "u-001",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-03-15T14:22:00Z",
    publishedAt: "2026-02-05T09:00:00Z",
    version: 4,
  },
  {
    id: "a-002",
    name: "Cardiology Screener",
    purpose:
      "Conduct a preliminary cardiology screening. Collect symptoms such as chest pain, shortness of breath, palpitations, and dizziness. Ask about family history of heart disease. Escalate immediately if patient reports chest pain or difficulty breathing.",
    voice: "alloy",
    language: "en-US",
    status: "published",
    tools: [
      {
        name: "symptom_checker",
        label: "Symptom Checker",
        description: "Cross-reference reported symptoms against known risk patterns",
        enabled: true,
      },
      {
        name: "escalation_trigger",
        label: "Escalation Trigger",
        description: "Flag session for staff review when risk conditions are met",
        enabled: true,
      },
    ],
    createdBy: "u-001",
    createdAt: "2026-02-10T11:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
    publishedAt: "2026-02-12T08:30:00Z",
    version: 1,
  },
  {
    id: "a-003",
    name: "Mental Health Check-In",
    purpose:
      "Conduct a brief mental health wellness check. Use empathetic, non-clinical language. Ask about sleep, mood over the past two weeks, stress levels, and support systems. Do NOT diagnose or recommend medications. Always remind the patient that a licensed professional will review their responses.",
    voice: "shimmer",
    language: "en-US",
    status: "draft",
    tools: [
      {
        name: "escalation_trigger",
        label: "Escalation Trigger",
        description: "Flag session for staff review when risk conditions are met",
        enabled: true,
      },
    ],
    createdBy: "u-001",
    createdAt: "2026-03-20T15:00:00Z",
    updatedAt: "2026-04-01T10:45:00Z",
    publishedAt: null,
    version: 2,
  },
  {
    id: "a-004",
    name: "Medication Review Bot",
    purpose:
      "Review patient current medications prior to appointment. Collect drug names, dosages, frequency, and prescribing doctor. Flag any potential interactions for staff review.",
    voice: "echo",
    language: "en-US",
    status: "archived",
    tools: [
      {
        name: "medication_lookup",
        label: "Medication Lookup",
        description: "Look up medication details and known interactions",
        enabled: true,
      },
    ],
    createdBy: "u-001",
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-02-28T16:00:00Z",
    publishedAt: "2026-01-22T10:00:00Z",
    version: 3,
  },
  {
    id: "a-005",
    name: "Post-Op Follow-Up",
    purpose:
      "Check in with patients 48 hours after a procedure. Ask about pain levels (1–10), wound site condition, fever, and medication compliance. Escalate if pain is 8 or above, or if patient reports unusual symptoms.",
    voice: "fable",
    language: "en-US",
    status: "draft",
    tools: [
      {
        name: "escalation_trigger",
        label: "Escalation Trigger",
        description: "Flag session for staff review when risk conditions are met",
        enabled: true,
      },
      {
        name: "appointment_lookup",
        label: "Appointment Lookup",
        description: "Verify upcoming follow-up appointments",
        enabled: false,
      },
    ],
    createdBy: "u-001",
    createdAt: "2026-04-01T08:00:00Z",
    updatedAt: "2026-04-01T08:00:00Z",
    publishedAt: null,
    version: 1,
  },
];

// ─── Transcripts ──────────────────────────────────────────────────────────────

const TRANSCRIPT_S001: TranscriptEntry[] = [
  { id: "t-s001-1", sessionId: "s-001", speaker: "assistant", content: "Hello! I'm here to help collect some information before your appointment today. This should only take a few minutes. Could you start by telling me your full name?", timestamp: "2026-04-05T09:00:05Z", sequence: 1 },
  { id: "t-s001-2", sessionId: "s-001", speaker: "user", content: "Hi, my name is Maria Torres.", timestamp: "2026-04-05T09:00:18Z", sequence: 2 },
  { id: "t-s001-3", sessionId: "s-001", speaker: "assistant", content: "Thank you, Maria. And could you confirm your date of birth?", timestamp: "2026-04-05T09:00:22Z", sequence: 3 },
  { id: "t-s001-4", sessionId: "s-001", speaker: "user", content: "March 14th, 1985.", timestamp: "2026-04-05T09:00:31Z", sequence: 4 },
  { id: "t-s001-5", sessionId: "s-001", speaker: "assistant", content: "Perfect. What is the primary reason for your visit today?", timestamp: "2026-04-05T09:00:35Z", sequence: 5 },
  { id: "t-s001-6", sessionId: "s-001", speaker: "user", content: "I've been having some lower back pain for about two weeks now. It's getting worse when I sit for long periods.", timestamp: "2026-04-05T09:00:52Z", sequence: 6 },
  { id: "t-s001-7", sessionId: "s-001", speaker: "assistant", content: "I understand, that sounds uncomfortable. Are you currently taking any medications — prescription or over-the-counter?", timestamp: "2026-04-05T09:00:58Z", sequence: 7 },
  { id: "t-s001-8", sessionId: "s-001", speaker: "user", content: "Just ibuprofen occasionally for the pain, and I take a daily vitamin D supplement.", timestamp: "2026-04-05T09:01:15Z", sequence: 8 },
  { id: "t-s001-9", sessionId: "s-001", speaker: "assistant", content: "Got it. Do you have any known allergies — to medications, foods, or anything else?", timestamp: "2026-04-05T09:01:20Z", sequence: 9 },
  { id: "t-s001-10", sessionId: "s-001", speaker: "user", content: "I'm allergic to penicillin.", timestamp: "2026-04-05T09:01:28Z", sequence: 10 },
  { id: "t-s001-11", sessionId: "s-001", speaker: "assistant", content: "Thank you for letting us know. Lastly, could you confirm your insurance provider?", timestamp: "2026-04-05T09:01:33Z", sequence: 11 },
  { id: "t-s001-12", sessionId: "s-001", speaker: "user", content: "Blue Cross Blue Shield.", timestamp: "2026-04-05T09:01:40Z", sequence: 12 },
  { id: "t-s001-13", sessionId: "s-001", speaker: "assistant", content: "Wonderful, I have everything I need. Your care team will review this before your appointment. Please remember that this is for informational purposes only and is not medical advice. Have a great day, Maria!", timestamp: "2026-04-05T09:01:50Z", sequence: 13 },
];

const TRANSCRIPT_S002: TranscriptEntry[] = [
  { id: "t-s002-1", sessionId: "s-002", speaker: "assistant", content: "Hello, I'll be conducting a brief cardiology screening today. Please let me know if you feel uncomfortable at any point and we can stop. Can you tell me your name?", timestamp: "2026-04-04T14:00:05Z", sequence: 1 },
  { id: "t-s002-2", sessionId: "s-002", speaker: "user", content: "James Okonkwo.", timestamp: "2026-04-04T14:00:12Z", sequence: 2 },
  { id: "t-s002-3", sessionId: "s-002", speaker: "assistant", content: "Thank you James. Have you been experiencing any chest pain or discomfort recently?", timestamp: "2026-04-04T14:00:17Z", sequence: 3 },
  { id: "t-s002-4", sessionId: "s-002", speaker: "user", content: "Yes, I've had some chest tightness for the past few days, especially when I climb stairs.", timestamp: "2026-04-04T14:00:38Z", sequence: 4 },
  { id: "t-s002-5", sessionId: "s-002", speaker: "assistant", content: "I want to make sure you get the right care quickly. I'm flagging this session for immediate staff review. A member of our team will be with you shortly. Please do not drive or exert yourself. Is there someone with you right now?", timestamp: "2026-04-04T14:00:45Z", sequence: 5 },
  { id: "t-s002-6", sessionId: "s-002", speaker: "user", content: "Yes, my wife is here.", timestamp: "2026-04-04T14:00:52Z", sequence: 6 },
  { id: "t-s002-7", sessionId: "s-002", speaker: "assistant", content: "Good. Stay with her and remain calm. Staff has been notified and will contact you within minutes.", timestamp: "2026-04-04T14:00:58Z", sequence: 7 },
];

const TRANSCRIPT_S003: TranscriptEntry[] = [
  { id: "t-s003-1", sessionId: "s-003", speaker: "assistant", content: "Good afternoon! I'm here to collect your pre-visit information. Could you start with your full name?", timestamp: "2026-04-03T11:00:05Z", sequence: 1 },
  { id: "t-s003-2", sessionId: "s-003", speaker: "user", content: "Linda Park.", timestamp: "2026-04-03T11:00:11Z", sequence: 2 },
  { id: "t-s003-3", sessionId: "s-003", speaker: "assistant", content: "Thanks Linda! And your date of birth?", timestamp: "2026-04-03T11:00:15Z", sequence: 3 },
  { id: "t-s003-4", sessionId: "s-003", speaker: "user", content: "September 3rd, 1978.", timestamp: "2026-04-03T11:00:22Z", sequence: 4 },
  { id: "t-s003-5", sessionId: "s-003", speaker: "assistant", content: "And what brings you in today?", timestamp: "2026-04-03T11:00:26Z", sequence: 5 },
  { id: "t-s003-6", sessionId: "s-003", speaker: "user", content: "Annual checkup.", timestamp: "2026-04-03T11:00:31Z", sequence: 6 },
  { id: "t-s003-7", sessionId: "s-003", speaker: "assistant", content: "Are you on any current medications?", timestamp: "2026-04-03T11:00:35Z", sequence: 7 },
  { id: "t-s003-8", sessionId: "s-003", speaker: "user", content: "Metformin 500mg daily and a multivitamin.", timestamp: "2026-04-03T11:00:48Z", sequence: 8 },
  { id: "t-s003-9", sessionId: "s-003", speaker: "assistant", content: "Any known allergies?", timestamp: "2026-04-03T11:00:52Z", sequence: 9 },
  { id: "t-s003-10", sessionId: "s-003", speaker: "user", content: "None that I know of.", timestamp: "2026-04-03T11:00:57Z", sequence: 10 },
  { id: "t-s003-11", sessionId: "s-003", speaker: "assistant", content: "And your insurance provider?", timestamp: "2026-04-03T11:01:01Z", sequence: 11 },
  { id: "t-s003-12", sessionId: "s-003", speaker: "user", content: "Aetna.", timestamp: "2026-04-03T11:01:05Z", sequence: 12 },
  { id: "t-s003-13", sessionId: "s-003", speaker: "assistant", content: "All set, Linda! Your information has been recorded for your care team. Have a great visit!", timestamp: "2026-04-03T11:01:12Z", sequence: 13 },
];

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const MOCK_SESSIONS: Session[] = [
  {
    id: "s-001",
    assistantId: "a-001",
    operatorId: "u-001",
    status: "completed",
    startedAt: "2026-04-05T09:00:00Z",
    endedAt: "2026-04-05T09:02:05Z",
    durationSecs: 125,
    turnCount: 13,
    summary: {
      isDraft: true,
      overview: "Patient Maria Torres completed pre-visit intake for a lower back pain complaint. All required fields collected. No escalation triggers met.",
      collectedFields: {
        name: "Maria Torres",
        dateOfBirth: "1985-03-14",
        reasonForVisit: "Lower back pain (2 weeks, worsening with prolonged sitting)",
        medications: "Ibuprofen (occasional), Vitamin D (daily)",
        allergies: "Penicillin",
        insurance: "Blue Cross Blue Shield",
      },
      escalationFlags: [],
    },
    transcript: TRANSCRIPT_S001,
    metadata: { browser: "Chrome 122", micGranted: true },
  },
  {
    id: "s-002",
    assistantId: "a-002",
    operatorId: "u-001",
    status: "needs_review",
    startedAt: "2026-04-04T14:00:00Z",
    endedAt: "2026-04-04T14:01:10Z",
    durationSecs: 70,
    turnCount: 7,
    summary: {
      isDraft: true,
      overview: "Patient James Okonkwo reported chest tightness on exertion during a cardiology screening. Escalation triggered. Session ended early and staff notified.",
      collectedFields: {
        name: "James Okonkwo",
        symptom: "Chest tightness on exertion (3 days)",
      },
      escalationFlags: [
        "Patient reported chest pain/tightness — immediate escalation protocol activated",
        "Incomplete intake — session ended due to escalation",
      ],
    },
    transcript: TRANSCRIPT_S002,
    metadata: { browser: "Firefox 124", micGranted: true, escalationAt: "2026-04-04T14:00:45Z" },
  },
  {
    id: "s-003",
    assistantId: "a-001",
    operatorId: "u-001",
    status: "completed",
    startedAt: "2026-04-03T11:00:00Z",
    endedAt: "2026-04-03T11:01:25Z",
    durationSecs: 85,
    turnCount: 13,
    summary: {
      isDraft: true,
      overview: "Patient Linda Park completed routine annual checkup intake. All required fields collected. No escalation flags.",
      collectedFields: {
        name: "Linda Park",
        dateOfBirth: "1978-09-03",
        reasonForVisit: "Annual checkup",
        medications: "Metformin 500mg (daily), Multivitamin",
        allergies: "None known",
        insurance: "Aetna",
      },
      escalationFlags: [],
    },
    transcript: TRANSCRIPT_S003,
    metadata: { browser: "Safari 17", micGranted: true },
  },
  {
    id: "s-004",
    assistantId: "a-002",
    operatorId: "u-001",
    status: "failed",
    startedAt: "2026-04-02T10:15:00Z",
    endedAt: "2026-04-02T10:15:22Z",
    durationSecs: 22,
    turnCount: 0,
    summary: null,
    transcript: [],
    metadata: { browser: "Chrome 122", micGranted: false, failureReason: "Microphone permission denied by user" },
  },
  {
    id: "s-005",
    assistantId: "a-001",
    operatorId: "u-002",
    status: "completed",
    startedAt: "2026-04-01T16:30:00Z",
    endedAt: "2026-04-01T16:33:10Z",
    durationSecs: 190,
    turnCount: 11,
    summary: {
      isDraft: true,
      overview: "Patient completed pre-visit intake. All standard fields collected. No escalation flags. Session ran slightly longer than average.",
      collectedFields: {
        name: "David Reyes",
        dateOfBirth: "1991-07-22",
        reasonForVisit: "Persistent headaches (1 month)",
        medications: "None",
        allergies: "Sulfa drugs",
        insurance: "United Healthcare",
      },
      escalationFlags: [],
    },
    transcript: [],
    metadata: { browser: "Edge 122", micGranted: true },
  },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: "al-001", userId: "u-001", action: "created", entityType: "assistant", entityId: "a-005", entityName: "Post-Op Follow-Up", changes: null, createdAt: "2026-04-01T08:00:00Z" },
  { id: "al-002", userId: "u-001", action: "session_started", entityType: "session", entityId: "s-005", entityName: "Pre-Visit Intake", changes: null, createdAt: "2026-04-01T16:30:00Z" },
  { id: "al-003", userId: "u-002", action: "session_ended", entityType: "session", entityId: "s-005", entityName: "Pre-Visit Intake", changes: { durationSecs: 190, turnCount: 11, status: "completed" }, createdAt: "2026-04-01T16:33:10Z" },
  { id: "al-004", userId: "u-001", action: "session_started", entityType: "session", entityId: "s-004", entityName: "Cardiology Screener", changes: null, createdAt: "2026-04-02T10:15:00Z" },
  { id: "al-005", userId: "u-001", action: "session_ended", entityType: "session", entityId: "s-004", entityName: "Cardiology Screener", changes: { status: "failed", failureReason: "Microphone permission denied" }, createdAt: "2026-04-02T10:15:22Z" },
  { id: "al-006", userId: "u-001", action: "session_started", entityType: "session", entityId: "s-003", entityName: "Pre-Visit Intake", changes: null, createdAt: "2026-04-03T11:00:00Z" },
  { id: "al-007", userId: "u-001", action: "session_ended", entityType: "session", entityId: "s-003", entityName: "Pre-Visit Intake", changes: { durationSecs: 85, turnCount: 13, status: "completed" }, createdAt: "2026-04-03T11:01:25Z" },
  { id: "al-008", userId: "u-001", action: "session_started", entityType: "session", entityId: "s-002", entityName: "Cardiology Screener", changes: null, createdAt: "2026-04-04T14:00:00Z" },
  { id: "al-009", userId: "u-001", action: "session_ended", entityType: "session", entityId: "s-002", entityName: "Cardiology Screener", changes: { status: "needs_review", escalationFlags: 2 }, createdAt: "2026-04-04T14:01:10Z" },
  { id: "al-010", userId: "u-001", action: "edited", entityType: "assistant", entityId: "a-003", entityName: "Mental Health Check-In", changes: { purpose: "updated instructions" }, createdAt: "2026-04-01T10:45:00Z" },
  { id: "al-011", userId: "u-001", action: "session_started", entityType: "session", entityId: "s-001", entityName: "Pre-Visit Intake", changes: null, createdAt: "2026-04-05T09:00:00Z" },
  { id: "al-012", userId: "u-001", action: "session_ended", entityType: "session", entityId: "s-001", entityName: "Pre-Visit Intake", changes: { durationSecs: 125, turnCount: 13, status: "completed" }, createdAt: "2026-04-05T09:02:05Z" },
  { id: "al-013", userId: "u-001", action: "edited", entityType: "assistant", entityId: "a-001", entityName: "Pre-Visit Intake", changes: { version: 4, fields: ["purpose"] }, createdAt: "2026-03-15T14:22:00Z" },
  { id: "al-014", userId: "u-001", action: "archived", entityType: "assistant", entityId: "a-004", entityName: "Medication Review Bot", changes: { previousStatus: "published" }, createdAt: "2026-02-28T16:00:00Z" },
  { id: "al-015", userId: "u-001", action: "published", entityType: "assistant", entityId: "a-002", entityName: "Cardiology Screener", changes: { previousStatus: "draft" }, createdAt: "2026-02-12T08:30:00Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getAssistantById(id: string) {
  return MOCK_ASSISTANTS.find((a) => a.id === id) ?? null;
}

export function getSessionById(id: string) {
  return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
}

export function getSessionsByAssistant(assistantId: string) {
  return MOCK_SESSIONS.filter((s) => s.assistantId === assistantId);
}

export function getUserById(id: string) {
  return MOCK_USERS.find((u) => u.id === id) ?? null;
}

export const AVAILABLE_TOOLS = [
  { name: "appointment_lookup", label: "Appointment Lookup", description: "Verify upcoming appointments for the patient" },
  { name: "insurance_check", label: "Insurance Check", description: "Verify insurance coverage status" },
  { name: "medication_lookup", label: "Medication Lookup", description: "Look up medication details and known interactions" },
  { name: "symptom_checker", label: "Symptom Checker", description: "Cross-reference reported symptoms against known risk patterns" },
  { name: "escalation_trigger", label: "Escalation Trigger", description: "Flag session for staff review when risk conditions are met" },
] as const;

export const VOICE_OPTIONS = [
  { value: "nova", label: "Nova — Warm & Clear" },
  { value: "alloy", label: "Alloy — Neutral & Balanced" },
  { value: "echo", label: "Echo — Deep & Steady" },
  { value: "fable", label: "Fable — Expressive & Bright" },
  { value: "onyx", label: "Onyx — Authoritative" },
  { value: "shimmer", label: "Shimmer — Calm & Gentle" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
] as const;
