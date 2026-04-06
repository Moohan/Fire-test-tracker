"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { z } from "zod";

const EquipmentSchema = z.object({
  externalId: z.string().min(1, "External ID is required"),
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["ON_RUN", "OFF_RUN"]),
});

const RequirementSchema = z.object({
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"]),
  type: z.enum(["VISUAL", "FUNCTIONAL"]),
});

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

  const validatedFields = EquipmentSchema.safeParse({
    externalId: formData.get("externalId"),
    name: formData.get("name"),
    location: formData.get("location"),
    category: formData.get("category"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const { externalId, name, location, category, status } = validatedFields.data;
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
  const frequencies = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;
  const requirementsData = frequencies
    .map((f) => {
      const type = formData.get(`req_${f}`) as string;
      if (!type || type === "NONE") return null;

      const validatedReq = RequirementSchema.safeParse({ frequency: f, type });
      if (!validatedReq.success) {
        throw new Error(`Invalid requirement for ${f}: ${validatedReq.error.issues[0].message}`);
      }
      return validatedReq.data;
    })
    .filter((r): r is { frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL"; type: "VISUAL" | "FUNCTIONAL" } => r !== null);

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
