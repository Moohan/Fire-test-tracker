"use client";

import { useState, useRef } from "react";
import { bulkUploadEquipment } from "./actions";

export default function BulkUploadForm() {
  const [isPending, setIsPending] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setResults(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await bulkUploadEquipment(formData);
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-sfrs-red/10 text-sfrs-red border border-sfrs-red/20 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      {results && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
          <p className="font-bold text-slate-900">Upload Complete</p>
          <p className="text-sm text-slate-600">Successfully processed {results.success} items.</p>
          {results.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold text-sfrs-red uppercase tracking-wider mb-1">Errors ({results.errors.length}):</p>
              <ul className="text-xs text-sfrs-red list-disc ml-4 max-h-40 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="flex flex-col items-center justify-center w-full h-44 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sfrs-red focus:border-transparent transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-slate-500 font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400">CSV files only</p>
              </div>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv"
                className="sr-only"
                required
                ref={fileInputRef}
              />
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-sfrs-red text-white font-bold py-4 px-6 rounded-md shadow-lg hover:bg-sfrs-red/90 active:scale-[0.98] transition-all min-h-[44px] disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Upload and Process"}
          </button>
        </div>
      </form>
    </div>
  );
}
