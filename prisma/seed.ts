import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  const viewerHash = await bcrypt.hash("viewer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: { email: "admin@test.com", passwordHash: adminHash, name: "Alex Johnson", role: "admin" },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@test.com" },
    update: {},
    create: { email: "viewer@test.com", passwordHash: viewerHash, name: "Sarah Chen", role: "viewer" },
  });

  console.log(`✓ Users: ${admin.email}, ${viewer.email}`);

  // ─── Assistants ─────────────────────────────────────────────────────────────
  const intakeTools = [
    { name: "appointment_lookup", label: "Appointment Lookup", description: "Verify upcoming appointments", enabled: true },
    { name: "insurance_check", label: "Insurance Check", description: "Verify insurance coverage status", enabled: true },
    { name: "escalation_trigger", label: "Escalation Trigger", description: "Flag session for staff review", enabled: true },
  ];

  const a1 = await prisma.assistant.upsert({
    where: { id: "seed-a-001" },
    update: {},
    create: {
      id: "seed-a-001",
      name: "Pre-Visit Intake",
      purpose: "Collect patient intake information before their appointment. Ask for full name, date of birth, reason for visit, current medications, known allergies, and insurance provider. Be warm and professional. Do not provide medical advice.",
      voice: "nova",
      language: "en-US",
      status: "published",
      tools: intakeTools,
      createdBy: admin.id,
      publishedAt: new Date("2026-02-05"),
      version: 4,
    },
  });

  const a2 = await prisma.assistant.upsert({
    where: { id: "seed-a-002" },
    update: {},
    create: {
      id: "seed-a-002",
      name: "Cardiology Screener",
      purpose: "Conduct a preliminary cardiology screening. Collect symptoms such as chest pain, shortness of breath, palpitations, and dizziness. Escalate immediately if patient reports chest pain.",
      voice: "alloy",
      language: "en-US",
      status: "published",
      tools: [
        { name: "symptom_checker", label: "Symptom Checker", description: "Cross-reference symptoms against known risk patterns", enabled: true },
        { name: "escalation_trigger", label: "Escalation Trigger", description: "Flag session for staff review", enabled: true },
      ],
      createdBy: admin.id,
      publishedAt: new Date("2026-02-12"),
      version: 1,
    },
  });

  const a3 = await prisma.assistant.upsert({
    where: { id: "seed-a-003" },
    update: {},
    create: {
      id: "seed-a-003",
      name: "Mental Health Check-In",
      purpose: "Conduct a brief mental health wellness check using empathetic, non-clinical language. Do NOT diagnose or recommend medications. Always remind the patient a licensed professional will review their responses.",
      voice: "shimmer",
      language: "en-US",
      status: "draft",
      tools: [{ name: "escalation_trigger", label: "Escalation Trigger", description: "Flag session for staff review", enabled: true }],
      createdBy: admin.id,
      version: 2,
    },
  });

  console.log(`✓ Assistants: ${a1.name}, ${a2.name}, ${a3.name}`);

  // ─── Sessions + Transcripts ──────────────────────────────────────────────────
  const s1 = await prisma.session.upsert({
    where: { id: "seed-s-001" },
    update: {},
    create: {
      id: "seed-s-001",
      assistantId: a1.id,
      operatorId: admin.id,
      status: "completed",
      startedAt: new Date("2026-04-05T09:00:00Z"),
      endedAt: new Date("2026-04-05T09:02:05Z"),
      durationSecs: 125,
      turnCount: 6,
      summary: {
        isDraft: true,
        overview: "Patient Maria Torres completed pre-visit intake for lower back pain. All fields collected. No escalation triggers.",
        collectedFields: { name: "Maria Torres", dob: "1985-03-14", reason: "Lower back pain", medications: "Ibuprofen, Vitamin D", allergies: "Penicillin", insurance: "Blue Cross Blue Shield" },
        escalationFlags: [],
      },
      metadata: { browser: "Chrome 122", micGranted: true },
    },
  });

  await prisma.transcriptEntry.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-t-001-1", sessionId: s1.id, speaker: "assistant", content: "Hello! I'm here to help collect some information before your appointment today. Could you start by telling me your full name?", timestamp: new Date("2026-04-05T09:00:05Z"), sequence: 1 },
      { id: "seed-t-001-2", sessionId: s1.id, speaker: "user", content: "Hi, my name is Maria Torres.", timestamp: new Date("2026-04-05T09:00:18Z"), sequence: 2 },
      { id: "seed-t-001-3", sessionId: s1.id, speaker: "assistant", content: "Thank you, Maria. And could you confirm your date of birth?", timestamp: new Date("2026-04-05T09:00:22Z"), sequence: 3 },
      { id: "seed-t-001-4", sessionId: s1.id, speaker: "user", content: "March 14th, 1985.", timestamp: new Date("2026-04-05T09:00:31Z"), sequence: 4 },
      { id: "seed-t-001-5", sessionId: s1.id, speaker: "assistant", content: "What is the primary reason for your visit today?", timestamp: new Date("2026-04-05T09:00:35Z"), sequence: 5 },
      { id: "seed-t-001-6", sessionId: s1.id, speaker: "user", content: "I've been having lower back pain for about two weeks. It gets worse when I sit for long periods.", timestamp: new Date("2026-04-05T09:00:52Z"), sequence: 6 },
    ],
  });

  const s2 = await prisma.session.upsert({
    where: { id: "seed-s-002" },
    update: {},
    create: {
      id: "seed-s-002",
      assistantId: a2.id,
      operatorId: admin.id,
      status: "needs_review",
      startedAt: new Date("2026-04-04T14:00:00Z"),
      endedAt: new Date("2026-04-04T14:01:10Z"),
      durationSecs: 70,
      turnCount: 4,
      summary: {
        isDraft: true,
        overview: "Patient James Okonkwo reported chest tightness on exertion. Escalation triggered. Staff notified.",
        collectedFields: { name: "James Okonkwo", symptom: "Chest tightness on exertion (3 days)" },
        escalationFlags: ["Patient reported chest pain/tightness — escalation protocol activated"],
      },
      metadata: { browser: "Firefox 124", micGranted: true, escalationAt: "2026-04-04T14:00:45Z" },
    },
  });

  await prisma.transcriptEntry.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-t-002-1", sessionId: s2.id, speaker: "assistant", content: "Hello! I'll be conducting a brief cardiology screening today. Can you tell me your name?", timestamp: new Date("2026-04-04T14:00:05Z"), sequence: 1 },
      { id: "seed-t-002-2", sessionId: s2.id, speaker: "user", content: "James Okonkwo.", timestamp: new Date("2026-04-04T14:00:12Z"), sequence: 2 },
      { id: "seed-t-002-3", sessionId: s2.id, speaker: "assistant", content: "Have you been experiencing any chest pain or discomfort recently?", timestamp: new Date("2026-04-04T14:00:17Z"), sequence: 3 },
      { id: "seed-t-002-4", sessionId: s2.id, speaker: "user", content: "Yes, chest tightness for the past few days, especially when I climb stairs.", timestamp: new Date("2026-04-04T14:00:38Z"), sequence: 4 },
      { id: "seed-t-002-5", sessionId: s2.id, speaker: "assistant", content: "I'm flagging this session for immediate staff review. Please remain calm and stay with someone. Staff will contact you within minutes.", timestamp: new Date("2026-04-04T14:00:45Z"), sequence: 5 },
    ],
  });

  const s3 = await prisma.session.upsert({
    where: { id: "seed-s-003" },
    update: {},
    create: {
      id: "seed-s-003",
      assistantId: a1.id,
      operatorId: admin.id,
      status: "failed",
      startedAt: new Date("2026-04-02T10:15:00Z"),
      endedAt: new Date("2026-04-02T10:15:22Z"),
      durationSecs: 22,
      turnCount: 0,
      summary: Prisma.DbNull,
      metadata: { browser: "Chrome 122", micGranted: false, failureReason: "Microphone permission denied by user" },
    },
  });

  console.log(`✓ Sessions: ${s1.id}, ${s2.id}, ${s3.id}`);

  // ─── Audit Logs ─────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-al-001", userId: admin.id, action: "published", entityType: "assistant", entityId: a1.id, entityName: a1.name, changes: { previousStatus: "draft" }, createdAt: new Date("2026-02-05T09:00:00Z") },
      { id: "seed-al-002", userId: admin.id, action: "published", entityType: "assistant", entityId: a2.id, entityName: a2.name, changes: { previousStatus: "draft" }, createdAt: new Date("2026-02-12T08:30:00Z") },
      { id: "seed-al-003", userId: admin.id, action: "session_started", entityType: "session", entityId: s2.id, entityName: a2.name, changes: Prisma.DbNull, createdAt: new Date("2026-04-04T14:00:00Z") },
      { id: "seed-al-004", userId: admin.id, action: "session_ended", entityType: "session", entityId: s2.id, entityName: a2.name, changes: { status: "needs_review", escalationFlags: 1 }, createdAt: new Date("2026-04-04T14:01:10Z") },
      { id: "seed-al-005", userId: admin.id, action: "session_started", entityType: "session", entityId: s1.id, entityName: a1.name, changes: Prisma.DbNull, createdAt: new Date("2026-04-05T09:00:00Z") },
      { id: "seed-al-006", userId: admin.id, action: "session_ended", entityType: "session", entityId: s1.id, entityName: a1.name, changes: { durationSecs: 125, turnCount: 6, status: "completed" }, createdAt: new Date("2026-04-05T09:02:05Z") },
    ],
  });

  console.log("✓ Audit logs seeded");
  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
