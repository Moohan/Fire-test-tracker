import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EquipmentForm from "../components/EquipmentForm";
import { Equipment, Frequency, TestType } from "@/types/equipment";
import { Prisma } from "@prisma/client";

type EquipmentWithRequirements = Prisma.EquipmentGetPayload<{
  include: { requirements: true };
}>;

function toEquipmentInitialData(raw: EquipmentWithRequirements): Equipment {
  return {
    id: raw.id,
    externalId: raw.externalId,
    name: raw.name,
    location: raw.location,
    category: raw.category,
    procedurePath: raw.procedurePath,
    status: raw.status as "ON_RUN" | "OFF_RUN",
    sfrsId: raw.sfrsId,
    mfrId: raw.mfrId,
    expiryDate: raw.expiryDate ? raw.expiryDate.toISOString() : null,
    removedAt: raw.removedAt ? raw.removedAt.toISOString() : null,
    statutoryExamination: Boolean(raw.statutoryExamination),
    trackHours: Boolean(raw.trackHours),
    requirements: raw.requirements.map((r) => ({
      id: r.id,
      equipmentId: r.equipmentId,
      frequency: r.frequency as Frequency,
      type: r.type as TestType,
    })),
  };
}

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
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
      <header className="mb-6">
        <Link
          href="/admin/equipment"
          className="text-sm text-sfrs-red hover:underline mb-1 inline-block"
        >
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
          Edit Equipment
        </h1>
        <p className="text-slate-500 font-medium">
          {equipment.name} ({equipment.externalId})
        </p>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6">
        <EquipmentForm initialData={toEquipmentInitialData(equipment)} />
      </div>
    </div>
  );
}
