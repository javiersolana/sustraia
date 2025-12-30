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

    const carrera = await prisma.completedWorkout.findFirst({
        where: {
            title: { contains: 'Carrera' },
            userId: user.id
        },
        include: {
            user: true
        },
        orderBy: { completedAt: 'desc' }
    });

    if (!carrera) {
        console.log('Carrera not found');
        return;
    }

    console.log(`Title: ${carrera.title}`);
    console.log(`Label: ${carrera.label}`);
    console.log(`HR: Avg ${carrera.avgHeartRate}, Max ${carrera.maxHeartRate}`);
    console.log(`Pace: ${carrera.actualDistance ? (carrera.actualDuration / carrera.actualDistance * 1000 / 60).toFixed(2) : '-'} min/km`);
    console.log(`User Max HR: ${carrera.user.maxHeartRate}`);

    if (carrera.avgHeartRate && carrera.user.maxHeartRate) {
        console.log(`% Max HR: ${(carrera.avgHeartRate / carrera.user.maxHeartRate * 100).toFixed(1)}%`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
