import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminEquipmentPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    redirect("/");
  }

  const equipment = await prisma.equipment.findMany({
    orderBy: { externalId: "asc" },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Manage Equipment</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/audit"
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 min-h-[44px]"
          >
            Audit History
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 min-h-[44px]"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/equipment/bulk"
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 min-h-[44px]"
          >
            Bulk Upload
          </Link>
          <Link
            href="/admin/equipment/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sfrs-red hover:bg-sfrs-red/90 min-h-[44px]"
          >
            Add Equipment
          </Link>
        </div>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {equipment.length === 0 ? (
            <li className="px-6 py-12 text-center text-slate-500">No equipment found.</li>
          ) : (
            equipment.map((item) => (
              <li key={item.id} className="hover:bg-slate-50 transition-colors">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-sfrs-red uppercase tracking-wider">{item.externalId}</span>
                    <span className="text-lg font-bold text-slate-900 truncate">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.location} • {item.category}</span>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.status === "ON_RUN" ? "bg-sfrs-green/10 text-sfrs-green" : "bg-sfrs-red/10 text-sfrs-red"}`}>
                      {item.status}
                    </span>
                    <Link
                      href={`/admin/equipment/${item.id}`}
                      className="text-slate-600 hover:text-slate-900 text-sm font-bold uppercase min-h-[44px] flex items-center justify-center px-2"
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
