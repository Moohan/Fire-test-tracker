import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const LogSchema = z.object({
  equipmentId: z.string(),
  type: z.enum(["VISUAL", "FUNCTIONAL", "ACCEPTANCE"]),
  result: z.enum(["PASS", "FAIL"]),
  notes: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = LogSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid request body", details: validated.error.format() }, { status: 400 });
    }

    const { equipmentId, type, result, notes, timestamp } = validated.data;

    // Verify equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    const result_log = await prisma.$transaction(async (tx) => {
      // 1. Create the log entry
      const log = await tx.testLog.create({
        data: {
          equipmentId,
          userId: session.user.id,
          type,
          result,
          notes,
          timestamp: timestamp ? new Date(timestamp) : undefined,
        },
      });

      // 2. Update the equipment status (OTR Workflow)
      // "If any test is marked as Fail, the equipment status becomes "Off the Run"."
      // "It remains OTR until a successful Acceptance Test is logged."

      let newStatus: "ON_RUN" | "OFF_RUN" | undefined;

      if (result === "FAIL") {
        newStatus = "OFF_RUN";
      } else if (result === "PASS" && type === "ACCEPTANCE") {
        newStatus = "ON_RUN";
      }

      if (newStatus && newStatus !== equipment.status) {
        await tx.equipment.update({
          where: { id: equipmentId },
          data: { status: newStatus },
        });
      }

      return log;
    });

    return NextResponse.json(result_log, { status: 201 });
  } catch (error) {
    console.error("Failed to log test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
