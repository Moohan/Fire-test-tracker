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

  const logs = await prisma.testLog.findMany({
    where: {
      equipmentId: equipmentId || undefined,
      userId: userId || undefined,
      result: result || (undefined as any),
    },
    include: {
      equipment: {
        select: { externalId: true, name: true }
      },
      user: {
        select: { username: true }
      }
    },
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json(logs);
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
    await prisma.testLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
