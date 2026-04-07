import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const e1 = await prisma.equipment.upsert({
    where: { externalId: "E001" },
    update: {},
    create: {
      externalId: "E001",
      name: "Standard Hydrant Key",
      location: "Appliance 1",
      category: "Water Supplies",
      status: "ON_RUN",
      requirements: {
        create: [
          { frequency: "WEEKLY", type: "VISUAL" },
          { frequency: "MONTHLY", type: "FUNCTIONAL" }
        ]
      }
    }
  });

  console.log({
    admin: { id: admin.id, username: admin.username, role: admin.role },
    equipment: { id: e1.id, externalId: e1.externalId }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
