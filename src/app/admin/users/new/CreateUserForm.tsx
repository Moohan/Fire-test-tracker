"use client";

import { useActionState } from "react";
import { createUser } from "../actions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ActionState = {
  success?: boolean;
  error?: string;
};

async function createUserAction(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    await createUser(formData);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create user" };
  }
}

export default function CreateUserForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(createUserAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/admin/users");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-sfrs-red/10 text-sfrs-red border border-sfrs-red/20 rounded-md text-sm font-medium">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Username
          </label>
          <input
            type="text"
            name="username"
            id="username"
            required
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
            placeholder="e.g. jsmith"
          />
        </div>

        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            id="fullName"
            required
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
            placeholder="e.g. James Hayes"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            minLength={6}
            pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
            placeholder="••••••••"
          />
          <p className="mt-2 text-xs text-slate-500">
            Min 6 characters, at least one uppercase and one lowercase letter.
          </p>
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Role
          </label>
          <select
            name="role"
            id="role"
            required
            defaultValue="FIREFIGHTER"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-3 focus:ring-sfrs-red focus:border-sfrs-red min-h-[44px]"
          >
            <option value="FIREFIGHTER">Firefighter (FF)</option>
            <option value="CREW_COMMANDER">Crew Commander (CC)</option>
            <option value="WATCH_COMMANDER">Watch Commander (WC)</option>
            <option value="ADMIN">System Administrator</option>
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-sfrs-red text-white font-bold py-4 px-6 rounded-md shadow-lg hover:bg-sfrs-red/90 active:scale-[0.98] transition-all min-h-[44px] disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create User"}
        </button>
      </div>
    </form>
  );
}
