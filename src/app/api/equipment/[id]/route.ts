import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const data: {
      name?: string;
      location?: string | null;
      status?: "ON_RUN" | "OFF_RUN";
      removedAt?: Date | null;
      trackHours?: boolean;
    } = {};

    if (formData.has("name")) data.name = formData.get("name") as string;
    if (formData.has("location"))
      data.location = (formData.get("location") as string) || null;

    if (formData.has("status")) {
      const status = formData.get("status") as string;
      if (status === "ON_RUN" || status === "OFF_RUN") {
        data.status = status;
      } else {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    if (formData.has("trackHours"))
      data.trackHours = formData.get("trackHours") === "true";
    if (formData.has("removedAt")) {
      const val = formData.get("removedAt");
      data.removedAt = val ? new Date(val as string) : null;
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update equipment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
