"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const PasswordPolicy = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter");

const UserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(1, "Full name is required"),
  password: PasswordPolicy,
  role: z.enum(["ADMIN", "FF", "CC", "WC"]),
});

const PasswordResetSchema = z.object({
  password: PasswordPolicy,
});

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "WC", "CC"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createUser(formData: FormData) {
  await ensureAdmin();

  const validatedFields = UserSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const { username, fullName, password, role } = validatedFields.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        username,
        fullName,
        passwordHash,
        role,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new Error("Username already exists");
    }
    throw e;
  }

  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  const session = await ensureAdmin();

  if (id === session?.user?.id) {
    throw new Error("You cannot delete yourself");
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      throw new Error("User not found");
    }
    throw e;
  }

  revalidatePath("/admin/users");
}

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

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      throw new Error("User not found");
    }
    throw e;
  }

  revalidatePath("/admin/users");
}
