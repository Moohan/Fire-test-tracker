import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UserList from "./components/UserList";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link
            href="/admin/equipment"
            className="mr-4 text-rose-600 hover:text-rose-700"
          >
            ← Equipment
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700"
        >
          Add User
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <UserList users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
