import { getAllRooms, getRoomById, searchAvailableRooms, createRoom, updateRoom, deleteRoom } from '../../../src/controllers/room.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse, createTestRoom, createTestUser, createBookingWithDates } from '../../utils/testHelpers';

describe('Room Controller - Edge Cases', () => {
    describe('getAllRooms - Edge Cases', () => {
        it('should return empty array when no rooms exist', async () => {
            const req = mockRequest({}, {}, null, {});
            const res = mockResponse();

            await getAllRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: expect.any(Number)
            }));
        });

        it('should handle multiple filter combinations', async () => {
            await createTestRoom({ status: 'available', pricePerNight: 150, capacity: 2 });
            await createTestRoom({ status: 'maintenance', pricePerNight: 150, capacity: 2 });

            const req = mockRequest({}, {}, null, {
                status: 'available',
                minPrice: '100',
                maxPrice: '200',
                capacity: '2'
            });
            const res = mockResponse();

            await getAllRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(res.status).toHaveBeenCalledWith(200);
            call.data.rooms.forEach((r: any) => {
                expect(r.status).toBe('available');
                expect(r.pricePerNight).toBeGreaterThanOrEqual(100);
                expect(r.pricePerNight).toBeLessThanOrEqual(200);
            });
        });

        it('should handle invalid price range (minPrice > maxPrice)', async () => {
            await createTestRoom({ pricePerNight: 150 });

            const req = mockRequest({}, {}, null, { minPrice: '200', maxPrice: '100' });
            const res = mockResponse();

            await getAllRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.rooms).toHaveLength(0);
        });

        it('should filter by capacity greater than or equal to requested', async () => {
            await createTestRoom({ capacity: 1 });
            await createTestRoom({ capacity: 2 });
            await createTestRoom({ capacity: 4 });

            const req = mockRequest({}, {}, null, { capacity: '2' });
            const res = mockResponse();

            await getAllRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            call.data.rooms.forEach((r: any) => {
                expect(r.capacity).toBeGreaterThanOrEqual(2);
            });
        });

        it('should handle non-numeric query parameters gracefully', async () => {
            await createTestRoom();

            const req = mockRequest({}, {}, null, { minPrice: 'invalid', maxPrice: 'invalid' });
            const res = mockResponse();

            await getAllRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getRoomById - Edge Cases', () => {
        it('should handle invalid ID format', async () => {
            const req = mockRequest({}, { id: 'invalid' });
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle negative ID', async () => {
            const req = mockRequest({}, { id: -1 });
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle zero ID', async () => {
            const req = mockRequest({}, { id: 0 });
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('searchAvailableRooms - Edge Cases', () => {
        it('should return all available rooms when no filters provided', async () => {
            await createTestRoom({ status: 'available' });
            await createTestRoom({ status: 'available' });
            await createTestRoom({ status: 'occupied' });

            const req = mockRequest({}, {}, null, {});
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            call.data.rooms.forEach((r: any) => {
                expect(r.status).toBe('available');
            });
        });

        it('should exclude rooms in maintenance', async () => {
            await createTestRoom({ status: 'maintenance' });
            await createTestRoom({ status: 'available' });

            const req = mockRequest({}, {}, null, {});
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const maintenanceRooms = call.data.rooms.filter((r: any) => r.status === 'maintenance');
            expect(maintenanceRooms).toHaveLength(0);
        });

        it('should handle booking conflicts at exact boundaries', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom({ status: 'available' });

            const existingCheckIn = new Date('2030-06-01');
            const existingCheckOut = new Date('2030-06-05');

            await createBookingWithDates(user.id, room.id, existingCheckIn, existingCheckOut);

            const req = mockRequest({}, {}, null, {
                checkIn: '2030-06-05',
                checkOut: '2030-06-10'
            });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const roomIds = call.data.rooms.map((r: any) => r.id);
            expect(roomIds).toContain(room.id);
        });

        it('should exclude rooms with overlapping bookings (partial overlap)', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom({ status: 'available' });

            const existingCheckIn = new Date('2030-06-01');
            const existingCheckOut = new Date('2030-06-10');

            await createBookingWithDates(user.id, room.id, existingCheckIn, existingCheckOut);

            const req = mockRequest({}, {}, null, {
                checkIn: '2030-06-05',
                checkOut: '2030-06-15'
            });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const roomIds = call.data.rooms.map((r: any) => r.id);
            expect(roomIds).not.toContain(room.id);
        });

        it('should filter by room type', async () => {
            await createTestRoom({ type: 'single', status: 'available' });
            await createTestRoom({ type: 'suite', status: 'available' });

            const req = mockRequest({}, {}, null, { type: 'suite' });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            call.data.rooms.forEach((r: any) => {
                expect(r.type).toBe('suite');
            });
        });

        it('should combine multiple filters correctly', async () => {
            await createTestRoom({ status: 'available', capacity: 4, pricePerNight: 150, type: 'suite' });
            await createTestRoom({ status: 'available', capacity: 2, pricePerNight: 100, type: 'single' });

            const req = mockRequest({}, {}, null, {
                capacity: '3',
                minPrice: '140',
                maxPrice: '200',
                type: 'suite'
            });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            call.data.rooms.forEach((r: any) => {
                expect(r.capacity).toBeGreaterThanOrEqual(3);
                expect(r.pricePerNight).toBeGreaterThanOrEqual(140);
                expect(r.pricePerNight).toBeLessThanOrEqual(200);
                expect(r.type).toBe('suite');
            });
        });

        it('should return empty array when no rooms match criteria', async () => {
            await createTestRoom({ capacity: 2, status: 'available' });

            const req = mockRequest({}, {}, null, { capacity: '10' });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.rooms).toHaveLength(0);
        });
    });

    describe('createRoom - Edge Cases', () => {
        it('should return 409 when creating room with duplicate room number', async () => {
            const roomNumber = `DUPLICATE-${Date.now()}`;
            await createTestRoom({ roomNumber });

            const roomData = {
                roomNumber,
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                amenities: ['WiFi'],
                photos: [],
                description: 'Test room',
                status: 'available'
            };

            const req = mockRequest(roomData);
            const res = mockResponse();

            await createRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('should create room with minimum valid data', async () => {
            const roomData = {
                roomNumber: `MIN-${Date.now()}`,
                type: 'single',
                capacity: 1,
                pricePerNight: 0,
                amenities: [],
                photos: [],
                description: 'Minimal room',
                status: 'available'
            };

            const req = mockRequest(roomData);
            const res = mockResponse();

            await createRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should create room with all amenities', async () => {
            const roomData = {
                roomNumber: `FULL-${Date.now()}`,
                type: 'presidential',
                capacity: 10,
                pricePerNight: 1000,
                amenities: ['WiFi', 'TV', 'Mini Bar', 'Balcony', 'Ocean View', 'Jacuzzi'],
                photos: ['photo1.jpg', 'photo2.jpg'],
                description: 'Luxury presidential suite',
                status: 'available'
            };

            const req = mockRequest(roomData);
            const res = mockResponse();

            await createRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.room.amenities).toEqual(roomData.amenities);
        });

        it('should handle very long description', async () => {
            const roomData = {
                roomNumber: `LONG-${Date.now()}`,
                type: 'single',
                capacity: 2,
                pricePerNight: 100,
                amenities: [],
                photos: [],
                description: 'A'.repeat(500),
                status: 'available'
            };

            const req = mockRequest(roomData);
            const res = mockResponse();

            await createRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('updateRoom - Edge Cases', () => {
        it('should allow partial updates', async () => {
            const room = await createTestRoom({ pricePerNight: 100 });

            const req = mockRequest({ pricePerNight: 150 }, { id: room.id });
            const res = mockResponse();

            await updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.room.pricePerNight).toBe(150);
            expect(call.data.room.roomNumber).toBe(room.roomNumber);
        });

        it('should update room status', async () => {
            const room = await createTestRoom({ status: 'available' });

            const req = mockRequest({ status: 'maintenance' }, { id: room.id });
            const res = mockResponse();

            await updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.room.status).toBe('maintenance');
        });

        it('should update amenities array', async () => {
            const room = await createTestRoom({ amenities: ['WiFi'] });

            const req = mockRequest({ amenities: ['WiFi', 'TV', 'Mini Bar'] }, { id: room.id });
            const res = mockResponse();

            await updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.room.amenities).toEqual(['WiFi', 'TV', 'Mini Bar']);
        });

        it('should handle updating non-existent room', async () => {
            const req = mockRequest({ pricePerNight: 999 }, { id: 999999 });
            const res = mockResponse();

            await updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should allow updating to zero price', async () => {
            const room = await createTestRoom({ pricePerNight: 100 });

            const req = mockRequest({ pricePerNight: 0 }, { id: room.id });
            const res = mockResponse();

            await updateRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.data.room.pricePerNight).toBe(0);
        });
    });

    describe('deleteRoom - Edge Cases', () => {
        it('should successfully delete room without bookings', async () => {
            const room = await createTestRoom();

            const req = mockRequest({}, { id: room.id });
            const res = mockResponse();

            await deleteRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            const deleted = await prisma.room.findUnique({ where: { id: room.id } });
            expect(deleted).toBeNull();
        });

        it('should handle deleting non-existent room', async () => {
            const req = mockRequest({}, { id: 999999 });
            const res = mockResponse();

            await deleteRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle deleting room with invalid ID', async () => {
            const req = mockRequest({}, { id: 'invalid' });
            const res = mockResponse();

            await deleteRoom(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should delete room in any status', async () => {
            const statuses = ['available', 'occupied', 'maintenance'];

            for (const status of statuses) {
                const room = await createTestRoom({ status });

                const req = mockRequest({}, { id: room.id });
                const res = mockResponse();

                await deleteRoom(req, res);

                expect(res.status).toHaveBeenCalledWith(200);
            }
        });
    });
});
