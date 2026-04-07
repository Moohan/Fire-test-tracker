import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTestingWindow, getPreviousTestingWindow } from "@/lib/testing-windows";
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
        orderBy: { timestamp: "desc" },
      },
    },
  });

  const now = new Date();

  const dashboardData = equipment.map((item) => {
    const compliance = item.requirements.map((req) => {
      const freq = req.frequency as Frequency;
      const currentWindow = getTestingWindow(freq, now);
      const prevWindow = getPreviousTestingWindow(freq, now);

      const logsInCurrent = item.testLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= currentWindow.start && logDate <= currentWindow.end;
      });

      const logsInPrev = item.testLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= prevWindow.start && logDate <= prevWindow.end;
      });

      const hasFailInCurrent = logsInCurrent.some((log) => log.result === "FAIL");

      // Logic for Satisfaction:
      // VISUAL is satisfied if a PASS test (of any type) exists.
      // FUNCTIONAL is satisfied if a PASS Functional or Acceptance exists.
      const isSatisfied = (logs: typeof item.testLogs, type: string) => {
        if (type === "VISUAL") {
          return logs.some(log =>
            log.result === "PASS" &&
            (log.type === "VISUAL" || log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE")
          );
        } else if (type === "FUNCTIONAL") {
          return logs.some(log =>
            log.result === "PASS" &&
            (log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE")
          );
        }
        return false;
      };

      const currentSatisfied = isSatisfied(logsInCurrent, req.type);
      const prevSatisfied = isSatisfied(logsInPrev, req.type);

      // Status determined by colors:
      // Green: PASSED
      // Red: FAILED (in current) OR OTR
      // Amber: OVERDUE (Not passed in current AND Not passed in previous)
      // Grey: OUTSTANDING (Not passed in current BUT was passed in previous)

      let status: "PASSED" | "FAILED" | "OVERDUE" | "OUTSTANDING";

      if (currentSatisfied) {
        status = "PASSED";
      } else if (hasFailInCurrent || item.status === "OFF_RUN") {
        status = "FAILED";
      } else if (!prevSatisfied) {
        status = "OVERDUE";
      } else {
        status = "OUTSTANDING";
      }

      return {
        frequency: freq,
        type: req.type,
        status,
        satisfied: currentSatisfied,
        hasFail: hasFailInCurrent,
        windowId: currentWindow.id
      };
    });

    return {
      ...item,
      compliance,
    };
  });

  return NextResponse.json(dashboardData);
}
