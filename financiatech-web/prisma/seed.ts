import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@financiatech.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@financiatech.com",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const superAdmin = await prisma.superAdmin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId: superAdminUser.id,
    },
  });

  // ========== ADMIN VINCULADO ==========
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@financiatech.com" },
    update: {},
    create: {
      name: "Organización Admin",
      email: "admin@financiatech.com",
      password: hashedPassword, // Usamos la misma clave "admin123" para simplificar
      role: UserRole.ADMIN,
    },
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      superAdminId: superAdmin.id, // Relación clave
    },
  });

  console.log("Seed completed successfully");
  console.log("----------------------------");
  console.log("Super Admin creado:");
  console.log("Email: superadmin@financiatech.com");
  console.log("Password: admin123");
  console.log("----------------------------");
  console.log("Admin (Organización) creado:");
  console.log("Email: admin@financiatech.com");
  console.log("Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
