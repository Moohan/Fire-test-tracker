"use client";

import { useActionState } from "react";
import { bulkUploadEquipment } from "./actions";
import Link from "next/link";

interface BulkUploadResult {
  success: number;
  errors: string[];
}

export default function BulkUploadPage() {
  const [results, action, isPending] = useActionState<BulkUploadResult | null, FormData>(
    async (prevState: BulkUploadResult | null, formData: FormData) => {
      try {
        const res = await bulkUploadEquipment(formData);
        return res;
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return { success: 0, errors: [errorMessage] };
      }
    },
    null
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link
          href="/admin/equipment"
          className="mr-4 text-rose-600 hover:text-rose-700"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Bulk Upload Equipment
        </h1>
      </div>

      <div className="bg-white shadow p-6 rounded-lg space-y-6">
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-md">
          <h3 className="font-semibold text-slate-900 mb-2">
            CSV Format Instructions
          </h3>
          <p className="text-sm text-slate-600">
            The CSV must have the following headers:
          </p>
          <code className="block mt-2 p-2 bg-slate-100 rounded text-xs text-slate-800">
            Equipment_ID, Name, Location, Category, Weekly_Test_Type,
            Monthly_Test_Type, Quarterly_Test_Type, Annual_Test_Type
          </code>
          <p className="text-sm text-slate-600 mt-2">
            Values for Test_Type: <span className="font-mono">None</span>,{" "}
            <span className="font-mono">Visual</span>,{" "}
            <span className="font-mono">Functional</span>.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-slate-700"
            >
              Select CSV File
            </label>
            <input
              type="file"
              name="file"
              id="file"
              required
              accept=".csv"
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none disabled:opacity-50"
          >
            {isPending ? "Uploading..." : "Upload and Process CSV"}
          </button>
        </form>

        {results && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Results</h3>
            <p className="text-green-700 font-medium">
              Successfully processed {results.success} items.
            </p>
            {results.errors && results.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-red-700 font-medium">
                  Errors ({results.errors.length}):
                </p>
                <ul className="list-disc list-inside text-sm text-red-600 bg-red-50 p-4 border border-red-100 rounded-md">
                  {results.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
