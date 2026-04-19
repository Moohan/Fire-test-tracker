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
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <Link
          href="/admin/equipment"
          className="text-sm text-sfrs-red hover:underline mb-1 inline-block"
        >
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight">
          Bulk Upload Equipment
        </h1>
        <p className="text-slate-500 mt-1">
          Upload a CSV file to add multiple pieces of equipment at once.
        </p>
      </header>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-6">
        <BulkUploadForm />
      </div>

      <div className="mt-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          CSV Format Requirements
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Your CSV should include the following columns:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 font-mono bg-white p-4 rounded border">
          <li>Equipment_ID (Required, Unique)</li>
          <li>Name (Required)</li>
          <li>Location (Required)</li>
          <li>Category (Required)</li>
          <li>SFRS_ID (Optional)</li>
          <li>Manufacturer_ID (Optional)</li>
          <li>Weekly_Test_Type (Optional: VISUAL/FUNCTIONAL)</li>
          <li>Monthly_Test_Type (Optional: VISUAL/FUNCTIONAL)</li>
          <li>Quarterly_Test_Type (Optional: VISUAL/FUNCTIONAL)</li>
          <li>Annual_Test_Type (Optional: VISUAL/FUNCTIONAL)</li>
        </ul>
      </div>
    </div>
  );
}
