"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

interface CSVRow {
  Equipment_ID: string;
  Name: string;
  Location: string;
  Category: string;
  Weekly_Test_Type: string;
  Monthly_Test_Type: string;
  Quarterly_Test_Type: string;
  Annual_Test_Type: string;
}

export async function bulkUploadEquipment(formData: FormData) {
  await ensureAdmin();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("No file uploaded");
  }

  const csvString = await file.text();
  const parsed = Papa.parse<CSVRow>(csvString, {
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

  for (const row of parsed.data) {
    try {
      if (!row.Equipment_ID || !row.Name || !row.Location || !row.Category) {
        results.errors.push(`Missing required fields for row: ${JSON.stringify(row)}`);
        continue;
      }

      const requirements = [];
      if (row.Weekly_Test_Type && row.Weekly_Test_Type.toUpperCase() !== "NONE") {
        requirements.push({ frequency: "WEEKLY", type: row.Weekly_Test_Type.toUpperCase() });
      }
      if (row.Monthly_Test_Type && row.Monthly_Test_Type.toUpperCase() !== "NONE") {
        requirements.push({ frequency: "MONTHLY", type: row.Monthly_Test_Type.toUpperCase() });
      }
      if (row.Quarterly_Test_Type && row.Quarterly_Test_Type.toUpperCase() !== "NONE") {
        requirements.push({ frequency: "QUARTERLY", type: row.Quarterly_Test_Type.toUpperCase() });
      }
      if (row.Annual_Test_Type && row.Annual_Test_Type.toUpperCase() !== "NONE") {
        requirements.push({ frequency: "ANNUAL", type: row.Annual_Test_Type.toUpperCase() });
      }

      // We need to handle the requirements update properly in an upsert
      const equipment = await prisma.equipment.findUnique({
        where: { externalId: row.Equipment_ID },
        select: { id: true }
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
          })
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
      results.errors.push(`Error processing ID ${row.Equipment_ID}: ${errorMessage}`);
    }
  }

  revalidatePath("/admin/equipment");
  return results;
}
