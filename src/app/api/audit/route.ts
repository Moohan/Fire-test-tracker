import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId");
  const userId = searchParams.get("userId");
  const result = searchParams.get("result");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    equipmentId: equipmentId || undefined,
    userId: userId || undefined,
    result: result || undefined,
  };

  const [logs, total] = await Promise.all([
    prisma.testLog.findMany({
      where,
      include: {
        equipment: {
          select: { externalId: true, name: true }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.testLog.count({ where })
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    await prisma.$transaction([
      prisma.testLog.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      prisma.auditEvent.create({
        data: {
          actorId: session.user.id,
          action: "DELETE_TEST_LOG",
          targetId: id,
          timestamp: new Date(),
        }
      })
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
