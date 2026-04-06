import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

type ParamsContext = { params?: Promise<{ id: string }> | { id: string } };

async function resolveAssistantId(
  req: NextRequest,
  rawParams?: Promise<{ id: string }> | { id: string },
) {
  const params = rawParams ? await rawParams : undefined;
  const fromParams = params?.id?.trim();
  if (fromParams) return decodeURIComponent(fromParams);

  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length >= 3 && parts[0] === "api" && parts[1] === "assistants" && parts[2]) {
    return decodeURIComponent(parts[2]);
  }

  return "";
}

// PATCH /api/assistants/:id/publish
export async function PATCH(req: NextRequest, { params }: ParamsContext) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const id = await resolveAssistantId(req, params);
  if (!id || [":id", "[id]", "{id}", "undefined", "null"].includes(id)) {
    return NextResponse.json(
      { error: "Invalid assistant id. Use a real id from GET /api/assistants." },
      { status: 400 },
    );
  }

  const existing = await prisma.assistant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: `Assistant not found for id '${id}'` },
      { status: 404 },
    );
  }
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

export { PATCH as POST };
