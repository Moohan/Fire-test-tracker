import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTestingWindow,
  getPreviousTestingWindow,
} from "@/lib/testing-windows";
import { Frequency } from "@/types/equipment";
import {
  differenceInWeeks,
  differenceInMonths,
  differenceInQuarters,
  differenceInYears,
  startOfYear,
} from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yearStart = startOfYear(now);

  const equipment = await prisma.equipment.findMany({
    where: {
      OR: [{ removedAt: null }, { removedAt: { gte: yearStart } }],
    },
    include: {
      requirements: true,
      testLogs: {
        orderBy: { timestamp: "desc" },
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  const dashboardData = equipment.map((item) => {
    // If equipment is removed, it doesn't need compliance checking
    if (item.removedAt) {
      return {
        ...item,
        compliance: [],
      };
    }

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

      const hasFailInCurrent = logsInCurrent.some(
        (log) => log.result === "FAIL",
      );

      const isSatisfied = (
        logs: { result: string; type: string }[],
        type: string,
      ) => {
        if (type === "VISUAL") {
          return logs.some(
            (log) =>
              log.result === "PASS" &&
              (log.type === "VISUAL" ||
                log.type === "FUNCTIONAL" ||
                log.type === "ACCEPTANCE"),
          );
        } else if (type === "FUNCTIONAL") {
          return logs.some(
            (log) =>
              log.result === "PASS" &&
              (log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE"),
          );
        }
        return false;
      };

      const currentSatisfied = isSatisfied(logsInCurrent, req.type);
      const prevSatisfied = isSatisfied(logsInPrev, req.type);

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

      // Find the most recent relevant test log (regardless of window)
      const relevantLogs = item.testLogs.filter((log) => {
        if (req.type === "VISUAL") {
          return (
            log.type === "VISUAL" ||
            log.type === "FUNCTIONAL" ||
            log.type === "ACCEPTANCE"
          );
        } else if (req.type === "FUNCTIONAL") {
          return log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE";
        }
        return false;
      });

      const lastTest = relevantLogs[0] || null;
      let overdueLabel = null;

      if (status === "OVERDUE" && lastTest) {
        const lastDate = new Date(lastTest.timestamp);
        let diff = 0;
        let unit = "";

        switch (freq) {
          case "WEEKLY":
            diff = differenceInWeeks(now, lastDate);
            unit = diff === 1 ? "week" : "weeks";
            break;
          case "MONTHLY":
            diff = differenceInMonths(now, lastDate);
            unit = diff === 1 ? "month" : "months";
            break;
          case "QUARTERLY":
            diff = differenceInQuarters(now, lastDate);
            unit = diff === 1 ? "quarter" : "quarters";
            break;
          case "ANNUAL":
            diff = differenceInYears(now, lastDate);
            unit = diff === 1 ? "year" : "years";
            break;
        }

        if (diff > 0) {
          overdueLabel = `last test ${diff} ${unit} ago`;
        } else {
          overdueLabel = "last test < 1 unit ago";
        }
      } else if (status === "OVERDUE" && !lastTest) {
        overdueLabel = "never tested";
      }

      return {
        frequency: freq,
        type: req.type,
        status,
        satisfied: currentSatisfied,
        hasFail: hasFailInCurrent,
        windowId: currentWindow.id,
        lastTest:
          status === "PASSED" || status === "FAILED"
            ? {
                timestamp: lastTest?.timestamp,
                user: lastTest?.user,
                result: lastTest?.result,
              }
            : null,
        overdueLabel,
      };
    });

    return {
      ...item,
      compliance,
    };
  });

  return NextResponse.json(dashboardData);
}
