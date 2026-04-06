import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// PATCH /api/assistants/:id/publish
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "archived") {
    return NextResponse.json({ error: "Cannot publish an archived assistant" }, { status: 400 });
  }

  const assistant = await prisma.assistant.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "published",
      entityType: "assistant",
      entityId: assistant.id,
      entityName: assistant.name,
      changes: { status: "published" },
    },
  });

  return NextResponse.json(assistant);
}
