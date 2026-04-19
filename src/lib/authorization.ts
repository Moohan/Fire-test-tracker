import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "./roles";

export async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !(PRIVILEGED_ROLES as readonly string[]).includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}
