import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Javier Solana' },
    });

    if (!user) {
        console.log('User Javier Solana not found');
        return;
    }

    const recent = await prisma.completedWorkout.findMany({
        where: { userId: user.id },
        take: 2,
        orderBy: { completedAt: 'desc' },
        select: {
            title: true,
            label: true,
            humanReadable: true
        }
    });

    for (const r of recent) {
        console.log(`TITLE: ${r.title} | LABEL: ${r.label} | TYPE: ${r.humanReadable}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
