import Room from '../../../src/models/Room';

describe('Room Model', () => {
    describe('Validation', () => {
        it('should create a room with valid data', async () => {
            const room = await Room.create({
                roomNumber: '101',
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                amenities: ['WiFi', 'TV', 'AC'],
                description: 'Cozy single room with city view',
                status: 'available'
            });

            expect(room.roomNumber).toBe('101');
            expect(room.type).toBe('single');
            expect(room.capacity).toBe(2);
            expect(room.pricePerNight).toBe(100);
            expect(room.status).toBe('available');
        });

        it('should require roomNumber', async () => {
            const room = new Room({
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                description: 'Test room'
            });

            await expect(room.save()).rejects.toThrow();
        });

        it('should require unique roomNumber', async () => {
            await Room.create({
                roomNumber: '999',
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                description: 'First room'
            });

            const duplicateRoom = new Room({
                roomNumber: '999',
                type: 'double',
                capacity: 4,
                pricePerNight: 150,
                description: 'Second room'
            });

            await expect(duplicateRoom.save()).rejects.toThrow();
        });

        it('should default to single type', async () => {
            const room = await Room.create({
                roomNumber: '103',
                capacity: 2,
                pricePerNight: 100,
                description: 'Test room'
            });

            expect(room.type).toBe('single');
        });

        it('should require capacity', async () => {
            const room = new Room({
                roomNumber: '104',
                type: 'single',
                pricePerNight: 100,
                description: 'Test room'
            });

            await expect(room.save()).rejects.toThrow();
        });

        it('should require pricePerNight', async () => {
            const room = new Room({
                roomNumber: '105',
                type: 'single',
                capacity: 2,
                description: 'Test room'
            });

            await expect(room.save()).rejects.toThrow();
        });

        it('should validate price is positive', async () => {
            const room = new Room({
                roomNumber: '106',
                type: 'single',
                capacity: 2,
                pricePerNight: -50,
                description: 'Test room'
            });

            await expect(room.save()).rejects.toThrow();
        });

        it('should validate capacity is positive', async () => {
            const room = new Room({
                roomNumber: '107',
                type: 'single',
                capacity: 0,
                pricePerNight: 100,
                description: 'Test room'
            });

            await expect(room.save()).rejects.toThrow();
        });
    });

    describe('Status', () => {
        it('should accept valid statuses', async () => {
            const statuses: Array<'available' | 'occupied' | 'maintenance'> = ['available', 'occupied', 'maintenance'];

            for (let i = 0; i < statuses.length; i++) {
                const status = statuses[i];
                const room = await Room.create({
                    roomNumber: `20${i}`,
                    type: 'single',
                    capacity: 2,
                    pricePerNight: 100,
                    description: 'Test room',
                    status
                });

                expect(room.status).toBe(status);
            }
        });

        it('should reject invalid status', async () => {
            const room = new Room({
                roomNumber: '210',
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                description: 'Test room',
                status: 'invalid-status' as any
            });

            await expect(room.save()).rejects.toThrow();
        });

        it('should default to available status', async () => {
            const room = await Room.create({
                roomNumber: '211',
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                description: 'Test room'
            });

            expect(room.status).toBe('available');
        });
    });

    describe('Amenities and Photos', () => {
        it('should accept amenities array', async () => {
            const room = await Room.create({
                roomNumber: '301',
                type: 'suite',
                capacity: 4,
                pricePerNight: 250,
                description: 'Luxury suite',
                amenities: ['WiFi', 'TV', 'Mini Bar', 'Jacuzzi']
            });

            expect(room.amenities).toEqual(['WiFi', 'TV', 'Mini Bar', 'Jacuzzi']);
            expect(room.amenities.length).toBe(4);
        });

        it('should accept empty amenities array', async () => {
            const room = await Room.create({
                roomNumber: '302',
                type: 'single',
                capacity: 1,
                pricePerNight: 75,
                description: 'Basic room'
            });

            expect(room.amenities).toBeDefined();
            expect(Array.isArray(room.amenities)).toBe(true);
        });

        it('should accept photos array', async () => {
            const room = await Room.create({
                roomNumber: '303',
                type: 'double',
                capacity: 2,
                pricePerNight: 120,
                description: 'Room with photos',
                photos: ['photo1.jpg', 'photo2.jpg']
            });

            expect(room.photos).toEqual(['photo1.jpg', 'photo2.jpg']);
        });
    });

    describe('Timestamps', () => {
        it('should have createdAt and updatedAt timestamps', async () => {
            const room = await Room.create({
                roomNumber: '401',
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                description: 'Test room'
            });

            expect(room.createdAt).toBeDefined();
            expect(room.updatedAt).toBeDefined();
            expect(room.createdAt).toBeInstanceOf(Date);
            expect(room.updatedAt).toBeInstanceOf(Date);
        });
    });
});
