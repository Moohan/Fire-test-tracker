"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { z } from "zod";

const TestTypeSchema = z.enum(["NONE", "VISUAL", "FUNCTIONAL"]);

const CSVRowSchema = z.object({
  Equipment_ID: z.string().min(1, "Equipment_ID is required"),
  Name: z.string().min(1, "Name is required"),
  Location: z.string().min(1, "Location is required"),
  Category: z.string().min(1, "Category is required"),
  Weekly_Test_Type: TestTypeSchema.default("NONE"),
  Monthly_Test_Type: TestTypeSchema.default("NONE"),
  Quarterly_Test_Type: TestTypeSchema.default("NONE"),
  Annual_Test_Type: TestTypeSchema.default("NONE"),
});

interface RawCSVRow {
  Equipment_ID?: string;
  Name?: string;
  Location?: string;
  Category?: string;
  Weekly_Test_Type?: string;
  Monthly_Test_Type?: string;
  Quarterly_Test_Type?: string;
  Annual_Test_Type?: string;
}

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
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
      // Normalize row values to uppercase for the enum check
      const normalizedRow = Object.fromEntries(
        Object.entries(rawRow as Record<string, string>).map(([k, v]) => [
          k,
          k.endsWith("_Test_Type") ? (v || "NONE").toUpperCase() : v,
        ])
      );

      const validatedFields = CSVRowSchema.safeParse(normalizedRow);

      if (!validatedFields.success) {
        const errorDetails = validatedFields.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        results.errors.push(`Validation error for ID ${rawRow.Equipment_ID || "unknown"}: ${errorDetails}`);
        continue;
      }

      const row = validatedFields.data;

      const requirements = [];
      if (row.Weekly_Test_Type !== "NONE") {
        requirements.push({ frequency: "WEEKLY", type: row.Weekly_Test_Type });
      }
      if (row.Monthly_Test_Type !== "NONE") {
        requirements.push({ frequency: "MONTHLY", type: row.Monthly_Test_Type });
      }
      if (row.Quarterly_Test_Type !== "NONE") {
        requirements.push({ frequency: "QUARTERLY", type: row.Quarterly_Test_Type });
      }
      if (row.Annual_Test_Type !== "NONE") {
        requirements.push({ frequency: "ANNUAL", type: row.Annual_Test_Type });
      }

      // We need to handle the requirements update properly in an upsert
      const equipment = await prisma.equipment.findUnique({
        where: { externalId: row.Equipment_ID },
        select: { id: true },
      });

      if (equipment) {
        await prisma.$transaction([
          prisma.testRequirement.deleteMany({ where: { equipmentId: equipment.id } }),
          prisma.equipment.update({
            where: { id: equipment.id },
            data: {
              name: row.Name,
              location: row.Location,
              category: row.Category,
              requirements: {
                create: requirements,
              },
            },
          }),
        ]);
      } else {
        await prisma.equipment.create({
          data: {
            externalId: row.Equipment_ID,
            name: row.Name,
            location: row.Location,
            category: row.Category,
            requirements: {
              create: requirements,
            },
          },
        });
      }
      results.success++;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      results.errors.push(`Error processing ID ${rawRow.Equipment_ID || "unknown"}: ${errorMessage}`);
    }
  }

  revalidatePath("/admin/equipment");
  return results;
}
