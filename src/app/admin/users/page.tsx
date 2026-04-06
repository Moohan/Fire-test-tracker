import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UserList from "./components/UserList";

export default async function ManageUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link href="/admin/equipment" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Admin</Link>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Manage Users</h1>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sfrs-red hover:bg-sfrs-red/90 min-h-[44px]"
        >
          Add User
        </Link>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <UserList users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
