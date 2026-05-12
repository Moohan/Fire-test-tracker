import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTestingWindow,
  getPreviousTestingWindow,
  TestingWindow,
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

  // ⚡ Optimization: Pre-calculate testing windows for all frequencies outside the main loop
  const frequencies: Frequency[] = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"];
  const windowCache = Object.fromEntries(
    frequencies.map((f) => [
      f,
      {
        current: getTestingWindow(f, now),
        previous: getPreviousTestingWindow(f, now),
      },
    ])
  ) as Record<Frequency, { current: TestingWindow; previous: TestingWindow }>;

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

    // ⚡ Optimization: Pre-process logs once per equipment
    const processedLogs = item.testLogs.map(log => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
    }));

    // ⚡ Optimization: Pre-calculate logs in windows for each frequency ONCE per equipment
    const logsByFrequency = Object.fromEntries(
      frequencies.map(f => {
        const windows = windowCache[f];
        return [f, {
          current: processedLogs.filter(log => log.timestamp >= windows.current.start && log.timestamp <= windows.current.end),
          previous: processedLogs.filter(log => log.timestamp >= windows.previous.start && log.timestamp <= windows.previous.end)
        }];
      })
    );

    // ⚡ Optimization: Pre-filter relevant logs for each test type once per equipment
    const logsByType = {
      VISUAL: processedLogs.filter(log =>
        log.type === "VISUAL" || log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE"
      ),
      FUNCTIONAL: processedLogs.filter(log =>
        log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE"
      )
    };

    const compliance = item.requirements.map((req) => {
      const freq = req.frequency as Frequency;
      const type = req.type as keyof typeof logsByType;

      const logsInCurrent = logsByFrequency[freq].current;
      const logsInPrev = logsByFrequency[freq].previous;

      const hasFailInCurrent = logsInCurrent.some(log => log.result === "FAIL");

      const isSatisfied = (logs: typeof processedLogs, testType: string) => {
        if (testType === "VISUAL") {
          return logs.some(log =>
            log.result === "PASS" && (log.type === "VISUAL" || log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE")
          );
        } else if (testType === "FUNCTIONAL") {
          return logs.some(log =>
            log.result === "PASS" && (log.type === "FUNCTIONAL" || log.type === "ACCEPTANCE")
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

      // Find the most recent relevant test log (regardless of window) using pre-filtered lists
      const relevantLogs = logsByType[type] || [];
      const lastTest = relevantLogs[0] || null;
      let overdueLabel = null;

      if (status === "OVERDUE" && lastTest) {
        const lastDate = lastTest.timestamp;
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
        windowId: windowCache[freq].current.id,
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
