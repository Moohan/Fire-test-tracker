"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const EquipmentSchema = z.object({
  externalId: z.string().min(1, "External ID is required"),
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["ON_RUN", "OFF_RUN"]),
  sfrsId: z.string().optional().nullable(),
  mfrId: z.string().optional().nullable(),
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
    sfrsId: (formData.get("sfrsId") as string) || null,
    mfrId: (formData.get("mfrId") as string) || null,
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const { externalId, name, location, category, status, sfrsId, mfrId } = validatedFields.data;
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
            sfrsId,
            mfrId,
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
          sfrsId,
          mfrId,
          requirements: {
            create: requirementsData,
          },
        },
      });
    }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[]) || [];
      if (target.includes("externalId")) {
        throw new Error("Equipment ID already exists.");
      }
      if (target.includes("sfrsId")) {
        throw new Error("SFRS ID already exists.");
      }
      throw new Error("A unique constraint violation occurred.");
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
