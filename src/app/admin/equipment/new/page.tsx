import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EquipmentForm from "../components/EquipmentForm";

export default async function NewEquipmentPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add New Equipment</h1>
      <div className="bg-white shadow p-6 rounded-lg">
        <EquipmentForm />
      </div>
    </div>
  );
}
