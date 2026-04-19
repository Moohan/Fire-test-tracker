
"use client";

import { useTransition } from "react";
import { saveEquipment, deleteEquipment } from "../actions";
import { Equipment } from "@/types/equipment";

interface EquipmentFormProps {
  initialData?: Equipment & {
    requirements?: { frequency: string; type: string }[];
  };
}

const locations = [
  "Cab",
  "pump locker",
  "driver's side front",
  "driver's side rear",
  "offside front",
  "offside rear",
];

export function EquipmentForm({ initialData }: EquipmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeletingTransition] = useTransition();

  const frequencies = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await saveEquipment(formData, initialData?.id);
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : "An error occurred");
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (
      !confirm(
        "Are you sure you want to delete this equipment? This will also delete all associated test logs.",
      )
    )
      return;

    startDeletingTransition(async () => {
      try {
        await deleteEquipment(initialData.id);
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : "An error occurred");
      }
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Equipment Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              defaultValue={initialData?.name}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="sfrsId"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              SFRS ID
            </label>
            <input
              type="text"
              name="sfrsId"
              id="sfrsId"
              defaultValue={initialData?.sfrsId || ""}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="mfrId"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Manufacturer Serial No. (Mfr ID)
            </label>
            <input
              type="text"
              name="mfrId"
              id="mfrId"
              defaultValue={initialData?.mfrId || ""}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Location
            </label>
            <select
              name="location"
              id="location"
              defaultValue={initialData?.location || ""}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px] bg-white"
            >
              <option value="">Select Location (Optional)</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {initialData && (
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
              >
                Status
              </label>
              <select
                name="status"
                id="status"
                defaultValue={initialData?.status || "ON_RUN"}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px] bg-white"
              >
                <option value="ON_RUN">On the Run</option>
                <option value="OFF_RUN">Off the Run</option>
              </select>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-6">
            <input
              type="checkbox"
              name="trackHours"
              id="trackHours"
              value="true"
              defaultChecked={initialData?.trackHours}
              className="h-5 w-5 text-sfrs-red border-slate-300 rounded"
            />
            <label
              htmlFor="trackHours"
              className="text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Track Actions/Hours Used
            </label>
          </div>

          <div>
            <label
              htmlFor="expiryDate"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Expiry / Removal Date
            </label>
            <input
              type="date"
              name="expiryDate"
              id="expiryDate"
              defaultValue={
                initialData?.expiryDate
                  ? new Date(initialData.expiryDate).toISOString().split("T")[0]
                  : ""
              }
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px]"
            />
          </div>

          <div className="flex items-center space-x-3 pt-6">
            <input
              type="checkbox"
              name="statutoryExamination"
              id="statutoryExamination"
              value="true"
              defaultChecked={initialData?.statutoryExamination}
              className="h-5 w-5 text-sfrs-red border-slate-300 rounded"
            />
            <label
              htmlFor="statutoryExamination"
              className="text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Subject to statutory / external examination
            </label>
          </div>

          <div>
            <label
              htmlFor="removedAt"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Removed from Service Date
            </label>
            <input
              type="date"
              name="removedAt"
              id="removedAt"
              defaultValue={
                initialData?.removedAt
                  ? new Date(initialData.removedAt).toISOString().split("T")[0]
                  : ""
              }
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="procedureFile"
              className="block text-sm font-medium text-slate-700 uppercase tracking-wider"
            >
              Procedure File (PDF/Image)
            </label>
            <input
              type="file"
              name="procedureFile"
              id="procedureFile"
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 min-h-[44px]"
            />
            {initialData?.procedurePath && (
              <div className="mt-2 text-sm text-slate-500">
                Current:{" "}
                <a
                  href={initialData.procedurePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sfrs-red font-bold hover:underline"
                >
                  View File
                </a>
                <input
                  type="hidden"
                  name="currentProcedurePath"
                  value={initialData.procedurePath}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-wider border-b pb-2">
            Test Requirements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {frequencies.map((freq) => {
              const req = initialData?.requirements?.find(
                (r) => r.frequency === freq,
              );
              return (
                <div key={freq}>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">
                    {freq}
                  </label>
                  <select
                    name={`req_${freq}`}
                    defaultValue={req?.type || "NONE"}
                    className="block w-full border border-slate-300 rounded-md shadow-sm p-3 min-h-[44px] bg-white"
                  >
                    <option value="NONE">None</option>
                    <option value="VISUAL">Visual</option>
                    <option value="FUNCTIONAL">Functional</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isPending || isDeleting}
            className="w-full inline-flex justify-center py-4 px-4 border border-transparent shadow-lg text-base font-bold rounded-md text-white bg-sfrs-red hover:bg-sfrs-red/90 focus:outline-none disabled:opacity-50 min-h-[56px] uppercase tracking-wider transition-all active:scale-[0.98]"
          >
            {isPending
              ? "Saving..."
              : initialData
                ? "Update Equipment"
                : "Create Equipment"}
          </button>
        </div>
      </form>

      {initialData && (
        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="w-full inline-flex justify-center py-3 px-4 border border-slate-300 shadow-sm text-sm font-bold rounded-md text-sfrs-red bg-white hover:bg-sfrs-red/10 focus:outline-none disabled:opacity-50 min-h-[48px] uppercase tracking-wider transition-colors"
          >
            {isDeleting ? "Deleting..." : "Delete Equipment"}
          </button>
        </div>
      )}
    </div>
  );
}
