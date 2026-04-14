import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AuditPageClient from "./AuditPageClient";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    redirect("/");
  }

  const [logs, equipment, users] = await Promise.all([
    prisma.testLog.findMany({
      include: {
        equipment: true,
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    }),
    prisma.equipment.findMany({
      select: { id: true, name: true, externalId: true },
    }),
    prisma.user.findMany({
      select: { id: true, username: true, fullName: true },
    }),
  ]);

  return (
    <AuditPageClient initialLogs={logs} equipment={equipment} users={users} />
  );
}
