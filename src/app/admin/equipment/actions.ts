"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { Status } from "@/types/equipment";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

/**
 * Normalizes a procedure path to be relative to the public directory.
 * Prevents potential path traversal or absolute path issues.
 */
function getNormalizedProcedurePath(procedurePath: string): string {
  // Remove leading slashes to ensure it's relative when joined
  const normalized = procedurePath.startsWith("/") ? procedurePath.slice(1) : procedurePath;
  return normalized;
}

export async function saveEquipment(formData: FormData, id?: string) {
  await ensureAdmin();

  const externalId = formData.get("externalId") as string;
  const name = formData.get("name") as string;
  const location = formData.get("location") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as Status;
  const procedureFile = formData.get("procedureFile") as File;

  let procedurePath = (formData.get("currentProcedurePath") as string) || null;

  if (procedureFile && procedureFile.size > 0) {
    const bytes = await procedureFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "procedures");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${procedureFile.name}`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // If there was an old file, delete it
    if (procedurePath) {
      try {
        const normalizedOldPath = getNormalizedProcedurePath(procedurePath);
        await unlink(path.join(process.cwd(), "public", normalizedOldPath));
      } catch (e) {
        console.warn("Failed to delete old procedure file:", e);
      }
    }

    procedurePath = `/procedures/${filename}`;
  }

  // Handle requirements
  const frequencies = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"];
  const requirementsData = frequencies
    .map((f) => ({
      frequency: f,
      type: formData.get(`req_${f}`) as string,
    }))
    .filter((r) => r.type && r.type !== "NONE");

  try {
    if (id) {
      await prisma.$transaction([
        prisma.testRequirement.deleteMany({ where: { equipmentId: id } }),
        prisma.equipment.update({
          where: { id },
          data: {
            externalId,
            name,
            location,
            category,
            status,
            procedurePath,
            requirements: {
              create: requirementsData,
            },
          },
        }),
      ]);
    } else {
      await prisma.equipment.create({
        data: {
          externalId,
          name,
          location,
          category,
          status,
          procedurePath,
          requirements: {
            create: requirementsData,
          },
        },
      });
    }
  } catch (error: unknown) {
    // Narrowing the error type using a type predicate for safety and clarity
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new Error("Equipment ID already exists.");
    }
    throw error;
  }

  revalidatePath("/admin/equipment");
  redirect("/admin/equipment");
}

export async function deleteEquipment(id: string) {
  await ensureAdmin();

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { procedurePath: true },
  });

  if (equipment?.procedurePath) {
    try {
      const normalizedPath = getNormalizedProcedurePath(equipment.procedurePath);
      await unlink(path.join(process.cwd(), "public", normalizedPath));
    } catch (e) {
      console.warn("Failed to delete procedure file:", e);
    }
  }

  await prisma.equipment.delete({
    where: { id },
  });

  revalidatePath("/admin/equipment");
  redirect("/admin/equipment");
}
