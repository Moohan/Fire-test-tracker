"use client";

import { useActionState, useState } from "react";
import { saveEquipment, deleteEquipment } from "../actions";
import { Equipment } from "@/types/equipment";

interface EquipmentFormProps {
  initialData?: Equipment;
}

export default function EquipmentForm({ initialData }: EquipmentFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, action, isPending] = useActionState<string | null, FormData>(
    async (prevState: string | null, formData: FormData) => {
      try {
        await saveEquipment(formData, initialData?.id);
        return null;
      } catch (e: unknown) {
        return e instanceof Error ? e.message : String(e);
      }
    },
    null
  );

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this equipment? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEquipment(initialData.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete equipment");
      setIsDeleting(false);
    }
  };

  const frequencies = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"];

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="externalId"
              className="block text-sm font-medium text-slate-700"
            >
              External ID (Unique)
            </label>
            <input
              type="text"
              name="externalId"
              id="externalId"
              required
              defaultValue={initialData?.externalId}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              Equipment Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              defaultValue={initialData?.name}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-slate-700"
            >
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              required
              defaultValue={initialData?.location}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <input
              type="text"
              name="category"
              id="category"
              required
              defaultValue={initialData?.category}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700"
            >
              Status
            </label>
            <select
              name="status"
              id="status"
              defaultValue={initialData?.status || "ON_RUN"}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            >
              <option value="ON_RUN">On the Run</option>
              <option value="OFF_RUN">Off the Run</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="procedureFile"
              className="block text-sm font-medium text-slate-700"
            >
              Procedure File (PDF/Image)
            </label>
            <input
              type="file"
              name="procedureFile"
              id="procedureFile"
              className="mt-1 block w-full"
            />
            {initialData?.procedurePath && (
              <div className="mt-1 text-sm text-slate-500">
                Current:{" "}
                <a
                  href={initialData.procedurePath}
                  target="_blank"
                  className="text-rose-600 hover:underline"
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
          <h3 className="text-lg font-medium text-slate-900 mb-4">
            Test Requirements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {frequencies.map((freq) => {
              const req = initialData?.requirements?.find(
                (r) => r.frequency === freq
              );
              return (
                <div key={freq}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {freq}
                  </label>
                  <select
                    name={`req_${freq}`}
                    defaultValue={req?.type || "NONE"}
                    className="block w-full border border-slate-300 rounded-md shadow-sm p-2"
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
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none disabled:opacity-50"
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
            className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Equipment"}
          </button>
        </div>
      )}
    </div>
  );
}
