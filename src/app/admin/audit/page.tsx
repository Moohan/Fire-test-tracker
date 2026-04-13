import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditPageClient from "./AuditPageClient";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    redirect("/");
  }

  return <AuditPageClient />;
}
