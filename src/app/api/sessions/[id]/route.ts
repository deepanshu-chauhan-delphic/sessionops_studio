import { NextRequest, NextResponse } from "next/server";
import { Prisma, AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/api-auth";

type ParamsContext = { params?: Promise<{ id: string }> | { id: string } };

async function resolveSessionId(
  req: NextRequest,
  rawParams?: Promise<{ id: string }> | { id: string },
) {
  const params = rawParams ? await rawParams : undefined;
  const fromParams = params?.id?.trim();
  if (fromParams) return decodeURIComponent(fromParams);

  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length >= 3 && parts[0] === "api" && parts[1] === "sessions" && parts[2]) {
    return decodeURIComponent(parts[2]);
  }

  return "";
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const OVERVIEW_TEMPLATES = [
  "Patient completed a voice intake session. Chief complaint and relevant history have been documented. Clinical staff should verify the collected information prior to the scheduled appointment.",
  "Intake session concluded. The patient provided responses to all key intake questions. Preliminary data has been captured for clinical review. No session errors were reported.",
  "Voice-assisted pre-visit intake completed. Patient-reported symptoms and medical history have been logged. The summary below reflects information as stated by the patient and has not been clinically verified.",
  "Session completed without interruption. Patient disclosed primary concern and secondary details across multiple turns. Staff are advised to confirm allergy and medication data before prescribing.",
];

function buildDraftSummary(
  transcript: Array<{ speaker: "user" | "assistant"; content: string }>,
  status: "completed" | "failed" | "needs_review",
  extraEscalationFlags: string[] = [],
) {
  if (status === "failed") return null;

  const userTurns = transcript
    .filter((line) => line.speaker === "user")
    .map((line) => line.content.trim())
    .filter(Boolean);

  const fullText = userTurns.join(" ");

  // Risk signals
  const highRisk = /chest pain|can't breathe|difficulty breathing|suicidal|severe pain/i.test(fullText);
  const moderateRisk = /pain|ache|nausea|dizzy|fatigued|allerg|vomit|weakness/i.test(fullText);
  const riskLevel: "HIGH" | "MODERATE" | "LOW" = highRisk ? "HIGH" : moderateRisk ? "MODERATE" : "LOW";

  // Collected fields - map turns to clinical labels
  const collectedFields: Record<string, string> = {};
  if (userTurns[0]) collectedFields["Chief Complaint"] = userTurns[0];
  if (userTurns[1]) collectedFields["Secondary Detail"] = userTurns[1];
  const allergyTurn = userTurns.find((t) => /allerg/i.test(t));
  if (allergyTurn) collectedFields["Allergy History"] = allergyTurn;
  const medTurn = userTurns.find((t) => /medication|taking|ibuprofen|aspirin|prescription/i.test(t));
  if (medTurn) collectedFields["Current Medications"] = medTurn;
  if (userTurns.length > 2) {
    collectedFields["Additional Responses"] = `${userTurns.length - 2} further response(s) captured - see full transcript`;
  }

  // Escalation flags
  const escalationFlags = [...extraEscalationFlags];
  if (highRisk) escalationFlags.push("HIGH RISK: Urgent clinical review required before scheduling");
  if (/penicillin/i.test(fullText)) escalationFlags.push("Known allergy: Penicillin - verify before prescribing");
  if (/chest|breath/i.test(fullText)) escalationFlags.push("Possible cardiorespiratory symptom mentioned - confirm urgency");
  if (status === "needs_review") escalationFlags.push("Flagged for manual staff review");

  // Recommended actions
  const recommendedActions: string[] = [];
  if (highRisk) recommendedActions.push("Escalate to on-call clinician before appointment");
  if (allergyTurn) recommendedActions.push("Update allergy records prior to any prescription");
  if (medTurn) recommendedActions.push("Reconcile medications with pharmacy records");
  recommendedActions.push("Staff to confirm intake data with patient at check-in");

  // Overview - cycle through templates based on turn count for variety
  const overviewBase = OVERVIEW_TEMPLATES[userTurns.length % OVERVIEW_TEMPLATES.length];
  const riskNote =
    riskLevel === "HIGH"
      ? " URGENT: High-risk indicators detected - clinical escalation recommended."
      : riskLevel === "MODERATE"
        ? " Moderate risk indicators present. Standard clinical review advised."
        : "";
  const overview = overviewBase + riskNote;

  return {
    isDraft: true,
    draftLabel: "DRAFT - For Staff Review",
    generatedBy: "mock-llm-v1",
    riskLevel,
    overview,
    collectedFields,
    escalationFlags,
    recommendedActions,
  };
}

// GET /api/sessions/:id
export async function GET(req: NextRequest, { params }: ParamsContext) {
  const { error } = await requireAuth();
  if (error) return error;

  const id = await resolveSessionId(req, params);
  if (!id) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      assistant: { select: { id: true, name: true, status: true } },
      operator: { select: { id: true, name: true, email: true } },
      transcript: { orderBy: { sequence: "asc" } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

// POST /api/sessions/:id
// Supports:
// - action=append_transcript { speaker, content, timestamp? }
// - action=end { status?, failureReason?, escalationFlags?, metadata? }
export async function POST(req: NextRequest, { params }: ParamsContext) {
  const { error, session: authSession } = await requireAuth();
  if (error) return error;

  const id = await resolveSessionId(req, params);
  if (!id) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const existing = await prisma.session.findUnique({
    where: { id },
    include: {
      assistant: { select: { id: true, name: true } },
      transcript: { orderBy: { sequence: "asc" } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const action =
    body.action === "end" || body.action === "append_transcript"
      ? body.action
      : body.speaker && body.content
        ? "append_transcript"
        : "end";

  if (action === "append_transcript") {
    const speaker =
      body.speaker === "assistant"
        ? "assistant"
        : body.speaker === "user"
          ? "user"
          : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const inputTimestamp =
      typeof body.timestamp === "string" ? new Date(body.timestamp) : new Date();

    if (!speaker || !content) {
      return NextResponse.json(
        { error: "speaker and content are required" },
        { status: 400 },
      );
    }

    const sequenceData = await prisma.transcriptEntry.aggregate({
      where: { sessionId: id },
      _max: { sequence: true },
    });
    const sequence = (sequenceData._max.sequence ?? 0) + 1;

    const entry = await prisma.transcriptEntry.create({
      data: {
        sessionId: id,
        speaker,
        content,
        timestamp: Number.isNaN(inputTimestamp.getTime()) ? new Date() : inputTimestamp,
        sequence,
      },
    });

    await prisma.session.update({
      where: { id },
      data: { turnCount: sequence },
    });

    return NextResponse.json(entry, { status: 201 });
  }

  const requestedStatus =
    body.status === "failed" || body.status === "needs_review" || body.status === "completed"
      ? body.status
      : "completed";
  const failureReason =
    typeof body.failureReason === "string" ? body.failureReason.trim() : "";
  const escalationFlagsRaw = Array.isArray(body.escalationFlags)
    ? (body.escalationFlags as unknown[])
    : [];
  const escalationFlags = escalationFlagsRaw.filter(
    (flag): flag is string => typeof flag === "string",
  );
  const metadataPatch = asObject(body.metadata);

  const endedAt = new Date();
  const durationSecs = Math.max(
    0,
    Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000),
  );
  const turnCount = existing.transcript.length;

  const summary = buildDraftSummary(
    existing.transcript.map((line) => ({
      speaker: line.speaker as "user" | "assistant",
      content: line.content,
    })),
    requestedStatus,
    escalationFlags,
  );
  const summaryValue =
    summary === null ? Prisma.DbNull : (summary as Prisma.InputJsonValue);

  const session = await prisma.session.update({
    where: { id },
    data: {
      status: requestedStatus,
      endedAt,
      durationSecs,
      turnCount,
      summary: summaryValue,
      metadata: {
        ...(asObject(existing.metadata) || {}),
        ...metadataPatch,
        endedBy: authSession!.user.id,
        endedByRole: authSession!.user.role,
        ...(failureReason ? { failureReason } : {}),
      },
    },
    include: {
      assistant: { select: { id: true, name: true, status: true } },
      operator: { select: { id: true, name: true, email: true } },
      transcript: { orderBy: { sequence: "asc" } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authSession!.user.id,
      action: "session_ended",
      entityType: "session",
      entityId: session.id,
      entityName: existing.assistant.name,
      changes: {
        status: requestedStatus,
        durationSecs,
        turnCount,
        ...(failureReason ? { failureReason } : {}),
      },
    },
  });

  return NextResponse.json(session);
}

// PATCH /api/sessions/:id
// action=flag_review   completed → needs_review
// action=approve       needs_review → completed
// action=force_end     active → failed
export async function PATCH(req: NextRequest, { params }: ParamsContext) {
  const { error, session: authSession } = await requireAdmin();
  if (error) return error;

  const id = await resolveSessionId(req, params);
  if (!id) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const existing = await prisma.session.findUnique({
    where: { id },
    include: {
      assistant: { select: { name: true } },
      transcript: { orderBy: { sequence: "asc" } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action.trim() : "";

  if (action === "flag_review") {
    if (existing.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed sessions can be flagged for review" },
        { status: 400 },
      );
    }
    const session = await prisma.session.update({
      where: { id },
      data: { status: "needs_review" },
    });
    await prisma.auditLog.create({
      data: {
        userId: authSession!.user.id,
        action: "session_flagged" as unknown as AuditAction,
        entityType: "session",
        entityId: id,
        entityName: existing.assistant.name,
        changes: { previousStatus: "completed", newStatus: "needs_review" },
      },
    });
    return NextResponse.json(session);
  }

  if (action === "approve") {
    if (existing.status !== "needs_review") {
      return NextResponse.json(
        { error: "Only needs_review sessions can be approved" },
        { status: 400 },
      );
    }
    const session = await prisma.session.update({
      where: { id },
      data: { status: "completed" },
    });
    await prisma.auditLog.create({
      data: {
        userId: authSession!.user.id,
        action: "session_reviewed" as unknown as AuditAction,
        entityType: "session",
        entityId: id,
        entityName: existing.assistant.name,
        changes: { previousStatus: "needs_review", newStatus: "completed" },
      },
    });
    return NextResponse.json(session);
  }

  if (action === "force_end") {
    if (existing.status !== "active") {
      return NextResponse.json(
        { error: "Only active sessions can be force-ended" },
        { status: 400 },
      );
    }
    const endedAt = new Date();
    const durationSecs = Math.max(
      0,
      Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000),
    );
    const session = await prisma.session.update({
      where: { id },
      data: {
        status: "failed",
        endedAt,
        durationSecs,
        turnCount: existing.transcript.length,
        metadata: {
          ...(asObject(existing.metadata)),
          forceEnded: true,
          forceEndedBy: authSession!.user.id,
        },
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: authSession!.user.id,
        action: "session_ended",
        entityType: "session",
        entityId: id,
        entityName: existing.assistant.name,
        changes: { status: "failed", reason: "force_ended", durationSecs },
      },
    });
    return NextResponse.json(session);
  }

  if (action === "update_summary") {
    const overview =
      typeof body.overview === "string" ? body.overview.trim() : undefined;
    const staffNotes =
      typeof body.staffNotes === "string" ? body.staffNotes.trim() : undefined;

    const currentSummary = asObject(existing.summary);
    const updatedSummary = {
      ...currentSummary,
      ...(overview !== undefined ? { overview } : {}),
      ...(staffNotes !== undefined ? { staffNotes } : {}),
      isDraft: false,
      reviewedAt: new Date().toISOString(),
      reviewedBy: authSession!.user.id,
    };

    const session = await prisma.session.update({
      where: { id },
      data: { summary: updatedSummary as Prisma.InputJsonValue },
    });

    await prisma.auditLog.create({
      data: {
        userId: authSession!.user.id,
        action: "session_reviewed" as unknown as AuditAction,
        entityType: "session",
        entityId: id,
        entityName: existing.assistant.name,
        changes: {
          summaryReviewed: true,
          overviewEdited: overview !== undefined && overview !== String(currentSummary.overview),
          staffNotesAdded: !!staffNotes,
        },
      },
    });

    return NextResponse.json(session);
  }

  return NextResponse.json(
    { error: "action must be one of: flag_review, approve, force_end, update_summary" },
    { status: 400 },
  );
}









