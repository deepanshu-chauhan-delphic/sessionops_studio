import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
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

// POST /api/assistants/:id/duplicate
export async function POST(req: NextRequest, { params }: ParamsContext) {
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
