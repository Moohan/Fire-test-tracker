"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { z } from "zod";

const UserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
  role: z.enum(["ADMIN", "USER"]),
});

const PasswordResetSchema = z.object({
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
});

/**
 * Ensure the current server session belongs to an admin user.
 *
 * @returns The current session object for the authenticated admin user.
 * @throws Error - "Unauthorized" if there is no session or the session user role is not "ADMIN".
 */
async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Create a new user from submitted form data.
 *
 * @param formData - Form data containing `username`, `password` and `role`. `username` must be at least 3 characters; `password` must be at least 6 characters and include at least one uppercase and one lowercase letter; `role` must be either `"ADMIN"` or `"USER"`.
 * @throws Error("Unauthorized") - if there is no session or the current user is not an admin.
 * @throws Error - with the first Zod validation message when input validation fails.
 * @throws Error("Username already exists") - if a user with the same username already exists.
 */
export async function createUser(formData: FormData) {
  await ensureAdmin();

  const validatedFields = UserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const { username, password, role } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new Error("Username already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
    },
  });

  revalidatePath("/admin/users");
}

/**
 * Delete a user by their ID and revalidate the admin users page.
 *
 * @param id - The ID of the user to delete
 * @throws Error("Unauthorized") if the caller is not an admin
 * @throws Error("You cannot delete yourself") if `id` matches the current admin's user id
 */
export async function deleteUser(id: string) {
  const session = await ensureAdmin();

  if (id === session.user.id) {
    throw new Error("You cannot delete yourself");
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/admin/users");
}

/**
 * Reset an existing user's password using the supplied form data.
 *
 * @param userId - ID of the user whose password will be updated
 * @param formData - FormData containing a `password` field that meets the password schema
 * @throws Error("Unauthorized") if the caller is not an admin or there is no session
 * @throws Error with the first validation issue message if the provided password is invalid
 */
export async function resetPassword(userId: string, formData: FormData) {
  await ensureAdmin();

  const validatedFields = PasswordResetSchema.safeParse({
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const { password } = validatedFields.data;
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/admin/users");
}
