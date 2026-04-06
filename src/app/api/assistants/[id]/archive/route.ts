import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// PATCH /api/assistants/:id/archive
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "archived") {
    return NextResponse.json({ error: "Already archived" }, { status: 400 });
  }

  const assistant = await prisma.assistant.update({
    where: { id },
    data: { status: "archived" },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: "archived",
      entityType: "assistant",
      entityId: assistant.id,
      entityName: assistant.name,
      changes: { status: "archived" },
    },
  });

  return NextResponse.json(assistant);
}
