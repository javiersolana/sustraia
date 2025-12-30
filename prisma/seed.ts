import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sustraia.com' },
    update: {},
    create: {
      email: 'admin@sustraia.com',
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin user created:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  console.log('\n📋 Login credentials:');
  console.log('   Email: admin@sustraia.com');
  console.log('   Password: admin123');
  console.log('\n⚠️  Remember to change this password in production!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
