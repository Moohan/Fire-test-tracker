import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UserList from "./components/UserList";
import { Prisma } from "@prisma/client";

export type UserDisplay = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    fullName: true;
    role: true;
  };
}>;

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link
            href="/admin/equipment"
            className="text-sm text-sfrs-red hover:underline mb-1 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">
            Manage Users
          </h1>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sfrs-red hover:bg-sfrs-red/90 min-h-[44px]"
        >
          Add User
        </Link>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <UserList
          users={users as UserDisplay[]}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
