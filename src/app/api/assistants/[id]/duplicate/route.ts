import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// POST /api/assistants/:id/duplicate
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await prisma.assistant.create({
    data: {
      name: `${existing.name} (Copy)`,
      purpose: existing.purpose,
      voice: existing.voice,
      language: existing.language,
      tools: existing.tools,
      status: "draft",
      createdBy: session!.user.id,
      version: 1,
    },
    include: { creator: { select: { id: true, name: true, email: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "duplicated",
      entityType: "assistant",
      entityId: copy.id,
      entityName: copy.name,
      changes: { duplicatedFrom: id },
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
