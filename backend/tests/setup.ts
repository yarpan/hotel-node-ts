import 'dotenv/config';
import prisma from '../src/utils/prismaClient';

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing';
    process.env.NODE_ENV = 'test';
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

// Delete all rows in dependency order after each test for isolation
afterEach(async () => {
    await prisma.booking.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.user.deleteMany({});
});
