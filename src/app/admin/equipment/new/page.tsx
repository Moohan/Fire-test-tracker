import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EquipmentForm from "../components/EquipmentForm";

export default async function NewEquipmentPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <Link href="/admin/equipment" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Admin</Link>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Add New Equipment</h1>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6">
        <EquipmentForm />
      </div>
    </div>
  );
}
