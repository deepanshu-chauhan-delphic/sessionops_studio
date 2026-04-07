import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/api-auth";

type Action = "publish" | "archive" | "duplicate";
type ParamsContext = { params: Promise<{ id: string }> | { id: string } };

function actionFromPath(pathname: string): Action | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 4 && parts[0] === "api" && parts[1] === "assistants") {
    const suffix = parts[3];
    if (suffix === "publish" || suffix === "archive" || suffix === "duplicate") {
      return suffix;
    }
  }
  return null;
}

function getAction(req: NextRequest): Action | null {
  const action = req.nextUrl.searchParams.get("action");
  if (action === "publish" || action === "archive" || action === "duplicate") {
    return action;
  }
  return actionFromPath(req.nextUrl.pathname);
}

async function getAssistantId(params: ParamsContext["params"]) {
  const resolved = await params;
  return resolved.id;
}

// GET /api/assistants/:id
export async function GET(_req: NextRequest, { params }: ParamsContext) {
  const { error } = await requireAuth();
  if (error) return error;

  const id = await getAssistantId(params);
  const assistant = await prisma.assistant.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true, email: true } } },
  });

  if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assistant);
}

// PUT /api/assistants/:id
export async function PUT(req: NextRequest, { params }: ParamsContext) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const id = await getAssistantId(params);
  const body = await req.json();
  const { name, purpose, voice, language, tools = [], status: requestedStatus } = body;

  if (!name?.trim() || !purpose?.trim() || !voice || !language) {
    return NextResponse.json({ error: "name, purpose, voice, and language are required" }, { status: 400 });
  }

  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "archived") {
    return NextResponse.json({ error: "Cannot edit an archived assistant" }, { status: 400 });
  }

  // Allow demoting published → draft explicitly
  const demoteToDraft = requestedStatus === "draft" && existing.status === "published";

  const assistant = await prisma.assistant.update({
    where: { id },
    data: {
      name: name.trim(),
      purpose: purpose.trim(),
      voice,
      language,
      tools,
      version: { increment: 1 },
      ...(demoteToDraft ? { status: "draft", publishedAt: null } : {}),
    },
    include: { creator: { select: { id: true, name: true, email: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "edited",
      entityType: "assistant",
      entityId: assistant.id,
      entityName: assistant.name,
      changes: { name, purpose, voice, language, tools },
    },
  });

  return NextResponse.json(assistant);
}

async function publishAssistant(id: string, userId: string) {
  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  if (existing.status === "archived") {
    return NextResponse.json({ error: "Cannot publish an archived assistant" }, { status: 400 });
  }

  const assistant = await prisma.assistant.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "published",
      entityType: "assistant",
      entityId: assistant.id,
      entityName: assistant.name,
      changes: { status: "published" },
    },
  });

  return NextResponse.json(assistant);
}

async function archiveAssistant(id: string, userId: string) {
  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  if (existing.status === "archived") {
    return NextResponse.json({ error: "Already archived" }, { status: 400 });
  }

  const assistant = await prisma.assistant.update({
    where: { id },
    data: { status: "archived" },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "archived",
      entityType: "assistant",
      entityId: assistant.id,
      entityName: assistant.name,
      changes: { status: "archived" },
    },
  });

  return NextResponse.json(assistant);
}

async function duplicateAssistant(id: string, userId: string) {
  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Assistant not found" }, { status: 404 });

  const tools =
    existing.tools === null ? [] : (existing.tools as Prisma.InputJsonValue);

  const copy = await prisma.assistant.create({
    data: {
      name: `${existing.name} (Copy)`,
      purpose: existing.purpose,
      voice: existing.voice,
      language: existing.language,
      tools,
      status: "draft",
      createdBy: userId,
      version: 1,
    },
    include: { creator: { select: { id: true, name: true, email: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "duplicated",
      entityType: "assistant",
      entityId: copy.id,
      entityName: copy.name,
      changes: { duplicatedFrom: id },
    },
  });

  return NextResponse.json(copy, { status: 201 });
}

// PATCH /api/assistants/:id?action=publish|archive
export async function PATCH(req: NextRequest, { params }: ParamsContext) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const action = getAction(req);
  if (!action || action === "duplicate") {
    return NextResponse.json(
      { error: "Invalid action for PATCH. Use action=publish or action=archive." },
      { status: 400 },
    );
  }

  const id = await getAssistantId(params);
  if (action === "publish") return publishAssistant(id, session!.user.id);
  return archiveAssistant(id, session!.user.id);
}

// POST /api/assistants/:id?action=duplicate|publish|archive
export async function POST(req: NextRequest, { params }: ParamsContext) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const action = getAction(req);
  if (!action) {
    return NextResponse.json(
      { error: "Missing action. Use action=duplicate, publish, or archive." },
      { status: 400 },
    );
  }

  const id = await getAssistantId(params);
  if (action === "duplicate") return duplicateAssistant(id, session!.user.id);
  if (action === "publish") return publishAssistant(id, session!.user.id);
  return archiveAssistant(id, session!.user.id);
}
