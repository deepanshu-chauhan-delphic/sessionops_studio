import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// GET /api/sessions?assistantId=&status=&search=
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const assistantId = searchParams.get("assistantId") || "";
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const sessions = await prisma.session.findMany({
    where: {
      ...(assistantId ? { assistantId } : {}),
      ...(status
        ? { status: status as "active" | "completed" | "failed" | "needs_review" }
        : {}),
      ...(search
        ? {
            OR: [
              { assistant: { name: { contains: search, mode: "insensitive" } } },
              { summary: { path: ["overview"], string_contains: search } },
            ],
          }
        : {}),
    },
    include: {
      assistant: { select: { id: true, name: true, status: true } },
      operator: { select: { id: true, name: true, email: true } },
      _count: { select: { transcript: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(sessions);
}

// POST /api/sessions
export async function POST(req: NextRequest) {
  const { error, session: authSession } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const assistantId =
    typeof body.assistantId === "string" ? body.assistantId.trim() : "";
  const metadata = asObject(body.metadata);

  if (!assistantId) {
    return NextResponse.json(
      { error: "assistantId is required" },
      { status: 400 },
    );
  }

  const assistant = await prisma.assistant.findUnique({ where: { id: assistantId } });
  if (!assistant) {
    return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
  }
  if (assistant.status !== "published") {
    return NextResponse.json(
      { error: "Only published assistants can be launched" },
      { status: 400 },
    );
  }

  const session = await prisma.session.create({
    data: {
      assistantId,
      operatorId: authSession!.user.id,
      status: "active",
      metadata: {
        mockRuntime: true,
        startedFrom: "session-ui",
        ...metadata,
      },
    },
    include: {
      assistant: { select: { id: true, name: true, status: true } },
      operator: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authSession!.user.id,
      action: "session_started",
      entityType: "session",
      entityId: session.id,
      entityName: assistant.name,
      changes: { status: "active" },
    },
  });

  return NextResponse.json(session, { status: 201 });
}
