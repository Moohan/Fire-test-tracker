import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [equipment, users] = await Promise.all([
    prisma.equipment.findMany({
      select: { id: true, externalId: true, name: true },
      orderBy: { externalId: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);

  return NextResponse.json({ equipment, users });
}
