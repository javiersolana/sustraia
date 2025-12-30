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
            humanReadable: true,
            classificationConfidence: true,
            completedAt: true,
            avgHeartRate: true,
            maxHeartRate: true,
            actualDistance: true,
            actualDuration: true,
            workoutStructure: true
        }
    });

    // Output one by one to avoid buffering mixup
    for (const [i, r] of recent.entries()) {
        const paceMinPerKm = r.actualDistance ? (r.actualDuration / r.actualDistance * 1000 / 60) : 0;
        const paceStr = paceMinPerKm > 0
            ? `${Math.floor(paceMinPerKm)}:${Math.round((paceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km`
            : '-';

        const percentMax = (r.avgHeartRate && user.maxHeartRate)
            ? Math.round(r.avgHeartRate / user.maxHeartRate * 100)
            : 0;

        console.log(`ACTIVITY_${i + 1}_TITLE: ${r.title}`);
        console.log(`ACTIVITY_${i + 1}_LABEL: ${r.label}`);
        console.log(`ACTIVITY_${i + 1}_TYPE: ${r.humanReadable || 'N/A'}`);
        console.log(`ACTIVITY_${i + 1}_HR: ${r.avgHeartRate || '-'} bpm (${percentMax}%)`);
        console.log(`ACTIVITY_${i + 1}_PACE: ${paceStr}`);
        console.log('---');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
