import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/api-auth";

// GET /api/assistants?search=&status=
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const assistants = await prisma.assistant.findMany({
    where: {
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { purpose: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(status ? { status: status as "draft" | "published" | "archived" } : {}),
    },
    include: { creator: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(assistants);
}

// POST /api/assistants
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, purpose, voice, language, tools = [], publish = false } = body;

  if (!name?.trim() || !purpose?.trim() || !voice || !language) {
    return NextResponse.json({ error: "name, purpose, voice, and language are required" }, { status: 400 });
  }

  const status = publish ? "published" : "draft";

  const assistant = await prisma.assistant.create({
    data: {
      name: name.trim(),
      purpose: purpose.trim(),
      voice,
      language,
      tools,
      status,
      createdBy: session!.user.id,
      publishedAt: publish ? new Date() : null,
    },
    include: { creator: { select: { id: true, name: true, email: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      action: publish ? "published" : "created",
      entityType: "assistant",
      entityId: assistant.id,
      entityName: assistant.name,
      changes: { status },
    },
  });

  return NextResponse.json(assistant, { status: 201 });
}
