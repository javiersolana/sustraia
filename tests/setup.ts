import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '../server/config/prisma';

beforeAll(async () => {
  // Ensure test database is clean
  console.log('Setting up test environment...');
});

afterEach(async () => {
  // Clean up database after each test
  const tables = ['Message', 'CompletedWorkout', 'Workout', 'Stat', 'StravaToken', 'User'];

  for (const table of tables) {
    try {
      await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany();
    } catch (error) {
      // Table might not exist or be empty
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
