"use server";

import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/authorization";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

const TestTypeSchema = z.enum(["NONE", "VISUAL", "FUNCTIONAL"]);

const CSVRowSchema = z.object({
  Equipment_ID: z.string().min(1, "Equipment_ID is required"),
  Name: z.string().min(1, "Name is required"),
  Location: z.string().optional().nullable(),
  SFRS_ID: z.string().optional().nullable(),
  Manufacturer_ID: z.string().optional().nullable(),
  Weekly_Test_Type: TestTypeSchema.default("NONE"),
  Monthly_Test_Type: TestTypeSchema.default("NONE"),
  Quarterly_Test_Type: TestTypeSchema.default("NONE"),
  Annual_Test_Type: TestTypeSchema.default("NONE"),
});

interface RawCSVRow {
  Equipment_ID?: string;
  Name?: string;
  Location?: string;
  SFRS_ID?: string;
  Manufacturer_ID?: string;
  Weekly_Test_Type?: string;
  Monthly_Test_Type?: string;
  Quarterly_Test_Type?: string;
  Annual_Test_Type?: string;
}

export async function bulkUploadEquipment(formData: FormData) {
  await ensureAdmin();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("No file uploaded");
  }

  const csvString = await file.text();
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV Parsing Error: ${parsed.errors[0].message}`);
  }

  const results = {
    success: 0,
    errors: [] as string[],
  };

  for (const rawRow of parsed.data as RawCSVRow[]) {
    try {
      const normalizedRow = Object.fromEntries(
        Object.entries(rawRow as Record<string, string>).map(([k, v]) => [
          k,
          k.endsWith("_Test_Type") ? (v || "NONE").toUpperCase() : v,
        ]),
      );

      const validatedFields = CSVRowSchema.safeParse(normalizedRow);

      if (!validatedFields.success) {
        const errorDetails = validatedFields.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        results.errors.push(
          `Validation error for ID ${rawRow.Equipment_ID || "unknown"}: ${errorDetails}`,
        );
        continue;
      }

      const row = validatedFields.data;

      const requirements = [];
      if (row.Weekly_Test_Type !== "NONE") {
        requirements.push({ frequency: "WEEKLY", type: row.Weekly_Test_Type });
      }
      if (row.Monthly_Test_Type !== "NONE") {
        requirements.push({
          frequency: "MONTHLY",
          type: row.Monthly_Test_Type,
        });
      }
      if (row.Quarterly_Test_Type !== "NONE") {
        requirements.push({
          frequency: "QUARTERLY",
          type: row.Quarterly_Test_Type,
        });
      }
      if (row.Annual_Test_Type !== "NONE") {
        requirements.push({ frequency: "ANNUAL", type: row.Annual_Test_Type });
      }

      const equipment = await prisma.equipment.findUnique({
        where: { sfrsId: row.SFRS_ID || row.Equipment_ID },
        select: { id: true },
      });

      if (equipment) {
        await prisma.$transaction([
          prisma.testRequirement.deleteMany({
            where: { equipmentId: equipment.id },
          }),
          prisma.equipment.update({
            where: { id: equipment.id },
            data: {
              name: row.Name,
              location: row.Location || null,
              sfrsId: row.SFRS_ID || row.Equipment_ID,
              mfrId: row.Manufacturer_ID || null,
              requirements: {
                create: requirements,
              },
            },
          }),
        ]);
      } else {
        await prisma.equipment.create({
          data: {
            externalId: randomUUID(),
            name: row.Name,
            location: row.Location || null,
            sfrsId: row.SFRS_ID || row.Equipment_ID,
            mfrId: row.Manufacturer_ID || null,
            requirements: {
              create: requirements,
            },
          },
        });
      }
      results.success++;
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const target = (e.meta?.target as string[]) || [];
        results.errors.push(
          `Duplicate field violation for ID ${rawRow.Equipment_ID}: ${target.join(", ")} already exists`,
        );
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        results.errors.push(
          `Error processing ID ${rawRow.Equipment_ID || "unknown"}: ${errorMessage}`,
        );
      }
    }
  }

  revalidatePath("/admin/equipment");
  return results;
}
