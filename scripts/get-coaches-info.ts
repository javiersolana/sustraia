import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCoachesInfo() {
  try {
    const coaches = await prisma.user.findMany({
      where: {
        role: 'COACH'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            athletes: true,
            workouts: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('\n=== COACHES EN LA BASE DE DATOS ===\n');
    coaches.forEach((coach, index) => {
      console.log(`${index + 1}. ${coach.name}`);
      console.log(`   Email: ${coach.email}`);
      console.log(`   Atletas: ${coach._count.athletes}`);
      console.log(`   Workouts creados: ${coach._count.workouts}`);
      console.log(`   Registrado: ${coach.createdAt.toLocaleDateString('es-ES')}`);
      console.log('');
    });

    console.log(`Total de coaches: ${coaches.length}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCoachesInfo();
