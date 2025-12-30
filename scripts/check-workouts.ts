import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find Javier Solana
    const users = await prisma.user.findMany({
        where: { name: { contains: 'Javier', mode: 'insensitive' } },
        select: { id: true, name: true, email: true }
    });
    console.log('=== Users found ===');
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
        // Get all completed workouts for this user
        const workouts = await prisma.completedWorkout.findMany({
            where: { userId: users[0].id },
            select: {
                id: true,
                title: true,
                label: true,
                stravaId: true,
                workoutStructure: true,
                humanReadable: true,
                classificationConfidence: true,
                actualDistance: true,
                actualDuration: true,
                completedAt: true
            },
            orderBy: { completedAt: 'desc' },
            take: 10
        });

        console.log('\n=== Recent Completed Workouts ===');
        for (const w of workouts) {
            console.log(`\n--- ${w.title} ---`);
            console.log(`  Label: ${w.label}`);
            console.log(`  Human Readable: ${w.humanReadable}`);
            console.log(`  Confidence: ${w.classificationConfidence}`);
            console.log(`  Strava ID: ${w.stravaId}`);
            console.log(`  Distance: ${w.actualDistance ? (w.actualDistance / 1000).toFixed(2) + 'km' : 'N/A'}`);
            console.log(`  Duration: ${w.actualDuration ? Math.round(w.actualDuration / 60) + 'min' : 'N/A'}`);
            console.log(`  Date: ${w.completedAt}`);

            if (w.workoutStructure) {
                console.log(`  Workout Structure:`);
                console.log(JSON.stringify(w.workoutStructure, null, 4));
            }
        }

        // Specifically look for 2x10' workouts
        const seriesWorkouts = await prisma.completedWorkout.findMany({
            where: {
                userId: users[0].id,
                OR: [
                    { title: { contains: '2x10', mode: 'insensitive' } },
                    { title: { contains: 'series', mode: 'insensitive' } },
                    { title: { contains: 'LT', mode: 'insensitive' } },
                    { label: 'SERIES' }
                ]
            },
            select: {
                id: true,
                title: true,
                label: true,
                stravaId: true,
                workoutStructure: true,
                humanReadable: true,
                classificationConfidence: true
            }
        });

        console.log('\n=== SERIES Workouts Found ===');
        console.log(JSON.stringify(seriesWorkouts, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
