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

    console.log(`--- 2 PREVIOUS ACTIVITIES FOR ${user.name.toUpperCase()} ---`);
    recent.forEach((r, i) => {
        // Pace calculation
        const paceMinPerKm = r.actualDistance ? (r.actualDuration / r.actualDistance * 1000 / 60) : 0;
        const paceStr = paceMinPerKm > 0
            ? `${Math.floor(paceMinPerKm)}:${Math.round((paceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km`
            : '-';

        // % HR
        const percentMax = (r.avgHeartRate && user.maxHeartRate)
            ? Math.round(r.avgHeartRate / user.maxHeartRate * 100)
            : 0;

        console.log(`\n#${i + 1}: ${r.title} (${r.completedAt.toISOString().split('T')[0]})`);
        console.log(`   Label:      ${r.label}`);
        console.log(`   Type:       ${r.humanReadable || 'N/A'}`);
        console.log(`   Confidence: ${r.classificationConfidence || 'N/A'}`);
        console.log(`   Avg HR:     ${r.avgHeartRate || '-'} bpm (${percentMax}%)`);
        console.log(`   Pace:       ${paceStr}`);

        // Check structure for "False Series" reason
        // @ts-ignore
        if (r.workoutStructure?.classification?.steady_state) {
            // @ts-ignore
            console.log(`   Note:       Detected as Steady State (Variability: ${r.workoutStructure.classification.pace_variability?.toFixed(3)})`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
