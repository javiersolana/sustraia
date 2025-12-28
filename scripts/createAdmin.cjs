const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
        data: {
            email: 'admin@sustraia.com',
            password: hashedPassword,
            name: 'Admin',
            role: 'COACH'
        }
    });
    console.log('Usuario creado:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
