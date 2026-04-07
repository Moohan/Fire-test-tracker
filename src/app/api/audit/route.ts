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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the log to be deleted
      const log = await tx.testLog.findUnique({
        where: { id },
        include: { equipment: true }
      });

      if (!log) throw new Error("Log not found");

      // 2. Perform irreversible (hard) delete
      await tx.testLog.delete({
        where: { id }
      });

      // 3. Record the audit event
      await tx.auditEvent.create({
        data: {
          actorId: session.user.id,
          action: "DELETE_TEST_LOG",
          targetId: id,
          timestamp: new Date(),
          metadata: JSON.stringify({
            equipmentId: log.equipmentId,
            type: log.type,
            result: log.result,
            timestamp: log.timestamp
          })
        }
      });

      // 4. OTR Reversion Logic
      // If the deleted log was a FAIL, check if we can bring the equipment back ON_RUN
      if (log.result === "FAIL" && log.equipment.status === "OFF_RUN") {
        const remainingFails = await tx.testLog.count({
          where: {
            equipmentId: log.equipmentId,
            result: "FAIL",
            deletedAt: null
          }
        });

        if (remainingFails === 0) {
          await tx.equipment.update({
            where: { id: log.equipmentId },
            data: { status: "ON_RUN" }
          });
        }
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Failed to delete log:", error);
    const message = error instanceof Error ? error.message : "Failed to delete log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
