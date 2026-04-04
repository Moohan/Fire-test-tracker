import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EquipmentForm from "../components/EquipmentForm";

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      requirements: true,
    },
  });

  if (!equipment) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Equipment</h1>
      <div className="bg-white shadow p-6 rounded-lg">
        <EquipmentForm initialData={equipment} />
      </div>
    </div>
  );
}
