import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { bulkUploadEquipment } from "./actions";

export default async function BulkUploadPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
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

        <form action={bulkUploadEquipment} className="space-y-6">
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2"
            >
              Choose CSV File
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center w-full h-44 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-slate-500 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400">CSV files only</p>
                </div>
                <input id="file" name="file" type="file" accept=".csv" className="hidden" required />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="w-full bg-sfrs-red text-white font-bold py-4 px-6 rounded-md shadow-lg hover:bg-sfrs-red/90 active:scale-[0.98] transition-all min-h-[44px]"
            >
              Upload and Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
