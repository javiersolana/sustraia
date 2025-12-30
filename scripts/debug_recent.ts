import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Javier Solana' },
    });

    if (!user) return;

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

    console.log(JSON.stringify(recent, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
