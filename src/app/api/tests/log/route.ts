import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const LogSchema = z.object({
  equipmentId: z.string(),
  type: z.string(),
  testCode: z.string().optional(),
  result: z.enum(["PASS", "FAIL"]),
  hoursUsed: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
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

    const { equipmentId, type, testCode, result, hoursUsed, notes, timestamp } = validated.data;

    const result_log = await prisma.$transaction(async (tx) => {
      // 1. Fetch equipment status inside the transaction to prevent race conditions
      const equipment = await tx.equipment.findUnique({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new Error("EQUIPMENT_NOT_FOUND");
      }

      // 2. Create the log entry
      const log = await tx.testLog.create({
        data: {
          equipmentId,
          userId: session.user.id,
          type,
          testCode,
          result,
          hoursUsed,
          notes,
          timestamp: timestamp ? new Date(timestamp) : undefined,
        },
      });

      // 3. Update the equipment status (OTR Workflow)
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EQUIPMENT_NOT_FOUND") {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }
    console.error("Failed to log test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
