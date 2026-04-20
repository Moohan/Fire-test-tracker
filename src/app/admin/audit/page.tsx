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

  const [equipment, users] = await Promise.all([
    prisma.equipment.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);

  return (
    <AuditPageClient initialMetadata={{ equipment, users }} />
  );
}
