import prisma from '../src/utils/prismaClient';

import bcrypt from 'bcryptjs';

async function main() {
    console.log('🌱 Seeding database...\n');

    // ── Users ────────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const users = [
        {
            email: 'admin@hotel.com',
            password,
            firstName: 'Admin',
            lastName: 'User',
            phone: '1234567890',
            role: 'admin' as const,
        },
        {
            email: 'guest@hotel.com',
            password,
            firstName: 'Guest',
            lastName: 'User',
            phone: '0987654321',
            role: 'guest' as const,
        }
    ];

    for (const user of users) {
        const existing = await prisma.user.findUnique({
            where: { email: user.email },
        });

        if (!existing) {
            await prisma.user.create({ data: user });
            console.log(`  ✓ User ${user.email} (${user.role}) created`);
        } else {
            console.log(`  – User ${user.email} already exists, skipping`);
        }
    }


    // ── Rooms ────────────────────────────────────────────────────
    const rooms = [
        {
            roomNumber: '101',
            type: 'single' as const,
            capacity: 1,
            pricePerNight: 89,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Fridge'],
            photos: [],
            description: 'A cozy single room with a comfortable bed, work desk, and a city view. Perfect for solo travellers.',
            status: 'available' as const,
        },
        {
            roomNumber: '102',
            type: 'single' as const,
            capacity: 1,
            pricePerNight: 95,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Safe'],
            photos: [],
            description: 'A bright single room on the quiet side of the building, featuring modern décor and blackout curtains.',
            status: 'available' as const,
        },
        {
            roomNumber: '201',
            type: 'double' as const,
            capacity: 2,
            pricePerNight: 139,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker'],
            photos: [],
            description: 'Spacious double room with a king-size bed, lounge area, and panoramic windows overlooking the garden.',
            status: 'available' as const,
        },
        {
            roomNumber: '202',
            type: 'double' as const,
            capacity: 2,
            pricePerNight: 145,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony'],
            photos: [],
            description: 'A charming double room with a private balcony, ideal for couples seeking a relaxing getaway.',
            status: 'available' as const,
        },
        {
            roomNumber: '301',
            type: 'suite' as const,
            capacity: 3,
            pricePerNight: 249,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Living Area', 'Bathrobe', 'Coffee Maker'],
            photos: [],
            description: 'Elegant suite featuring a separate living area, marble bathroom, and premium bedding for the ultimate comfort.',
            status: 'available' as const,
        },
        {
            roomNumber: '302',
            type: 'suite' as const,
            capacity: 3,
            pricePerNight: 269,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Living Area', 'Jacuzzi', 'Bathrobe'],
            photos: [],
            description: 'A luxurious corner suite with a private jacuzzi, walk-in closet, and stunning sunset views.',
            status: 'maintenance' as const,
        },
        {
            roomNumber: '401',
            type: 'deluxe' as const,
            capacity: 4,
            pricePerNight: 359,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Living Area', 'Kitchenette', 'Balcony', 'Bathrobe'],
            photos: [],
            description: 'Premium deluxe room with a fully equipped kitchenette, spacious balcony, and a king-size bed with premium linens.',
            status: 'available' as const,
        },
        {
            roomNumber: '501',
            type: 'presidential' as const,
            capacity: 4,
            pricePerNight: 599,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Living Area', 'Dining Area', 'Jacuzzi', 'Butler Service', 'Balcony', 'Bathrobe'],
            photos: [],
            description: 'The crown jewel — a sprawling presidential suite with a private dining room, wraparound terrace, jacuzzi, and 24-hour butler service.',
            status: 'available' as const,
        },
        {
            roomNumber: '103',
            type: 'single' as const,
            capacity: 1,
            pricePerNight: 79,
            amenities: ['Wi-Fi', 'TV', 'Air Conditioning'],
            photos: [],
            description: 'An affordable and compact single room perfect for a quick overnight stay.',
            status: 'available' as const,
        },
    ];

    for (const room of rooms) {
        const existing = await prisma.room.findUnique({
            where: { roomNumber: room.roomNumber },
        });

        if (!existing) {
            await prisma.room.create({ data: room });
            console.log(`  ✓ Room ${room.roomNumber} (${room.type}) created`);
        } else {
            console.log(`  – Room ${room.roomNumber} already exists, skipping`);
        }
    }

    console.log('\n✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
