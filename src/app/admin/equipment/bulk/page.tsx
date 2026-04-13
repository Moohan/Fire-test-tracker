import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BulkUploadForm from "./BulkUploadForm";

export default async function BulkUploadPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-6">
        <Link href="/admin/equipment" className="text-sm text-sfrs-red hover:underline mb-1 inline-block">← Back to Admin</Link>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">Bulk Upload Equipment</h1>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-sm text-slate-700 leading-relaxed">
          <p className="font-bold mb-2 uppercase tracking-wider">CSV Format Guide:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><span className="font-bold">Required Columns:</span> Equipment_ID, Name, Location, Category</li>
            <li><span className="font-bold">Optional Columns:</span> SFRS_ID, Manufacturer_ID</li>
            <li><span className="font-bold">Test Frequency Columns:</span> Weekly_Test_Type, Monthly_Test_Type, Quarterly_Test_Type, Annual_Test_Type</li>
            <li><span className="font-bold">Test Type Values:</span> None, Visual, Functional</li>
          </ul>
        </div>

        <BulkUploadForm />
      </div>
    </div>
  );
}
