import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.equipment.findUnique({
    where: { id },
    include: {
      requirements: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}
