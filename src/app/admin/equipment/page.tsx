import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EquipmentAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const equipment = await prisma.equipment.findMany({
    include: {
      requirements: true,
    },
    orderBy: {
      externalId: "asc",
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Equipment Management</h1>
        <div className="space-x-4">
          <Link
            href="/admin/equipment/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700"
          >
            Add Equipment
          </Link>
          <Link
            href="/admin/equipment/bulk"
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"
          >
            Bulk Upload
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {equipment.length === 0 ? (
            <li className="px-6 py-4 text-center text-slate-500">No equipment found.</li>
          ) : (
            equipment.map((item) => (
              <li key={item.id}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-rose-600">{item.externalId}</span>
                    <span className="text-lg font-bold text-slate-900">{item.name}</span>
                    <span className="text-sm text-slate-500">{item.location} • {item.category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === "ON_RUN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {item.status}
                    </span>
                    <Link
                      href={`/admin/equipment/${item.id}`}
                      className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
