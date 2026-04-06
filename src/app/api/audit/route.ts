import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/audit?entityType=&entityId=&limit=50
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType") || "";
  const entityId = searchParams.get("entityId") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entityType ? { entityType: entityType as "assistant" | "session" } : {}),
      ...(entityId ? { entityId } : {}),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs);
}
