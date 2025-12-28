const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Delete existing admin user if exists
    await prisma.user.deleteMany({
        where: { email: 'admin@sustraia.com' }
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
        data: {
            email: 'admin@sustraia.com',
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN'
        }
    });
    console.log('Usuario ADMIN creado:', user.email, '- Rol:', user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
