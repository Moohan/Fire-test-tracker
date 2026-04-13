import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateUserForm from "./CreateUserForm";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link href="/admin/users" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Users</Link>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Add New User</h1>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6">
        <CreateUserForm />
      </div>
    </div>
  );
}
