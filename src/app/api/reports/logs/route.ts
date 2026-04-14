import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const ids = searchParams.get("ids")?.split(",");

  if (!start || !end) {
    return NextResponse.json(
      { error: "Start and end dates are required" },
      { status: 400 },
    );
  }

  const logs = await prisma.testLog.findMany({
    where: {
      timestamp: {
        gte: new Date(start),
        lte: new Date(end + "T23:59:59.999Z"),
      },
      equipmentId: ids && ids.length > 0 ? { in: ids } : undefined,
    },
    include: {
      equipment: true,
      user: {
        select: {
          username: true,
          fullName: true,
          role: true,
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  return NextResponse.json(logs);
}
