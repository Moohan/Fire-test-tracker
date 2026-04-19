"use server";

import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/authorization";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

const EquipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.enum(["Cab", "pump locker", "driver's side front", "driver's side rear", "offside front", "offside rear"]).nullable().optional(),
  status: z.enum(["ON_RUN", "OFF_RUN"]),
  sfrsId: z.string().optional().nullable(),
  mfrId: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  statutoryExamination: z.boolean().default(false),
  removedAt: z.string().optional().nullable(),
  trackHours: z.boolean().default(false),
});

const RequirementSchema = z.object({
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"]),
  type: z.enum(["VISUAL", "FUNCTIONAL"]),
});

function getNormalizedProcedurePath(procedurePath: string): string {
  const normalized = procedurePath.startsWith("/")
    ? procedurePath.slice(1)
    : procedurePath;
  return normalized;
}

export async function saveEquipment(formData: FormData, id?: string) {
  await ensureAdmin();

  const validatedFields = EquipmentSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || null,
    status: formData.get("status") || "ON_RUN",
    sfrsId: (formData.get("sfrsId") as string) || null,
    mfrId: (formData.get("mfrId") as string) || null,
    expiryDate: (formData.get("expiryDate") as string) || null,
    statutoryExamination: formData.get("statutoryExamination") === "true",
    removedAt: (formData.get("removedAt") as string) || null,
    trackHours: formData.get("trackHours") === "true",
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const {
    name,
    location,
    status,
    sfrsId,
    mfrId,
    expiryDate,
    statutoryExamination,
    removedAt,
    trackHours,
  } = validatedFields.data;
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

  const frequencies = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;
  const requirementsData = frequencies
    .map((f) => {
      const type = formData.get(`req_${f}`) as string;
      if (!type || type === "NONE") return null;

      const validatedReq = RequirementSchema.safeParse({ frequency: f, type });
      if (!validatedReq.success) {
        throw new Error(
          `Invalid requirement for ${f}: ${validatedReq.error.issues[0].message}`,
        );
      }
      return validatedReq.data;
    })
    .filter(
      (
        r,
      ): r is {
        frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
        type: "VISUAL" | "FUNCTIONAL";
      } => r !== null,
    );

  const data: any = {
    name,
    location,
    status,
    procedurePath,
    sfrsId,
    mfrId,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    statutoryExamination,
    removedAt: removedAt ? new Date(removedAt) : null,
    trackHours,
    requirements: {
      create: requirementsData,
    },
  };

  try {
    if (id) {
      await prisma.$transaction([
        prisma.testRequirement.deleteMany({ where: { equipmentId: id } }),
        prisma.equipment.update({
          where: { id },
          data,
        }),
      ]);
    } else {
      data.externalId = randomUUID();
      await prisma.equipment.create({
        data,
      });
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[]) || [];
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
      const normalizedPath = getNormalizedProcedurePath(
        equipment.procedurePath,
      );
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
