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

    // Find 11x5min
    const rodaje = await prisma.completedWorkout.findFirst({
        where: {
            userId: user.id,
            title: { contains: '11x' }
        }
    });

    if (rodaje) {
        console.log(`[VERIFY 1] "${rodaje.title}" -> Label: ${rodaje.label} (Human: ${rodaje.humanReadable})`);
    } else {
        console.log('[VERIFY 1] "11x" workout not found');
    }

    // Find Competition (try keyword 'Carrera' or 'San Silvestre' or check recent COMPETICION)
    const competition = await prisma.completedWorkout.findFirst({
        where: {
            userId: user.id,
            OR: [
                { title: { contains: 'Carrera' } },
                { title: { contains: 'San Silvestre' } },
                { title: { contains: '10K' } }
            ]
        },
        orderBy: { completedAt: 'desc' }
    });

    if (competition) {
        console.log(`[VERIFY 2] "${competition.title}" -> Label: ${competition.label} (Human: ${competition.humanReadable})`);
    } else {
        console.log('[VERIFY 2] No competition found');
    }

    // List last 5 just in case
    const recent = await prisma.completedWorkout.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: { completedAt: 'desc' },
        select: { title: true, label: true, completedAt: true }
    });

    console.log('--- RECENT 5 ---');
    recent.forEach(r => console.log(`${r.title}: ${r.label}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
