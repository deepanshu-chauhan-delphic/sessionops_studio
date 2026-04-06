import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/api-auth";

// GET /api/assistants/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const assistant = await prisma.assistant.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true, email: true } } },
  });

  if (!assistant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assistant);
}

// PUT /api/assistants/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { name, purpose, voice, language, tools = [] } = body;

  if (!name?.trim() || !purpose?.trim() || !voice || !language) {
    return NextResponse.json({ error: "name, purpose, voice, and language are required" }, { status: 400 });
  }

  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "archived") {
    return NextResponse.json({ error: "Cannot edit an archived assistant" }, { status: 400 });
  }

  const assistant = await prisma.assistant.update({
    where: { id },
    data: {
      name: name.trim(),
      purpose: purpose.trim(),
      voice,
      language,
      tools,
      version: { increment: 1 },
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
