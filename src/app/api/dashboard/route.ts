import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTestingWindow } from "@/lib/testing-windows";
import { Frequency } from "@/types/equipment";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const equipment = await prisma.equipment.findMany({
    include: {
      requirements: true,
      testLogs: {
        where: { deletedAt: null },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  const now = new Date();

  const dashboardData = equipment.map((item) => {
    const compliance = item.requirements.map((req) => {
      const freq = req.frequency as Frequency;
      const window = getTestingWindow(freq, now);

      const logsInWindow = item.testLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= window.start && logDate <= window.end;
      });

      const hasFail = logsInWindow.some((log) => log.result === "FAIL");

      let satisfied = false;
      if (req.type === "VISUAL") {
        satisfied = logsInWindow.some(log =>
          log.result === "PASS" &&
          (log.type === "VISUAL" || log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE")
        );
      } else if (req.type === "FUNCTIONAL") {
        satisfied = logsInWindow.some(log =>
          log.result === "PASS" &&
          (log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE")
        );
      } else {
        // Default catch-all for potential future types or exact matching
        satisfied = logsInWindow.some(log => log.result === "PASS" && log.type === req.type);
      }

      return {
        frequency: freq,
        type: req.type,
        satisfied,
        hasFail,
        windowId: window.id
      };
    });

    return {
      ...item,
      compliance,
    };
  });

  return NextResponse.json(dashboardData);
}
