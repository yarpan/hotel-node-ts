import { getAllRooms, getRoomById, searchAvailableRooms, createRoom, updateRoom, deleteRoom } from '../../../src/controllers/room.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse, createTestRoom, createTestUser, createBookingWithDates } from '../../utils/testHelpers';

describe('Room Controller', () => {
    describe('getAllRooms', () => {
        it('should return all rooms', async () => {
            await createTestRoom({ status: 'available' });
            await createTestRoom({ status: 'occupied' });

            const req = mockRequest({}, {}, null, {});
            const res = mockResponse();

            await getAllRooms(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: expect.any(Number),
            }));
        });

        it('should filter rooms by status query param', async () => {
            await createTestRoom({ status: 'available' });
            await createTestRoom({ status: 'maintenance' });

            const req = mockRequest({}, {}, null, { status: 'maintenance' });
            const res = mockResponse();

            await getAllRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(res.status).toHaveBeenCalledWith(200);
            call.data.rooms.forEach((r: any) => expect(r.status).toBe('maintenance'));
        });

        it('should filter rooms by price range', async () => {
            await createTestRoom({ pricePerNight: 50 });
            await createTestRoom({ pricePerNight: 300 });

            const req = mockRequest({}, {}, null, { minPrice: '100', maxPrice: '200' });
            const res = mockResponse();

            await getAllRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(res.status).toHaveBeenCalledWith(200);
            call.data.rooms.forEach((r: any) => {
                expect(r.pricePerNight).toBeGreaterThanOrEqual(100);
                expect(r.pricePerNight).toBeLessThanOrEqual(200);
            });
        });
    });

    describe('getRoomById', () => {
        it('should return a room if ID is valid', async () => {
            const room = await createTestRoom();
            const req = mockRequest({}, { id: room.id });
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                data: expect.objectContaining({
                    room: expect.objectContaining({ roomNumber: room.roomNumber }),
                }),
            }));
        });

        it('should return 404 if room is not found', async () => {
            const req = mockRequest({}, { id: 999999 });
            const res = mockResponse();

            await getRoomById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('searchAvailableRooms', () => {
        it('should return available rooms when no dates are given', async () => {
            await createTestRoom({ status: 'available' });
            await createTestRoom({ status: 'occupied' });

            const req = mockRequest({}, {}, null, {});
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(res.status).toHaveBeenCalledWith(200);
            call.data.rooms.forEach((r: any) => expect(r.status).toBe('available'));
        });

        it('should exclude rooms with conflicting confirmed bookings', async () => {
            const { user } = await createTestUser();
            const bookedRoom = await createTestRoom({ status: 'available' });
            const freeRoom = await createTestRoom({ status: 'available' });

            const checkIn = new Date('2030-06-01');
            const checkOut = new Date('2030-06-05');

            await createBookingWithDates(user.id, bookedRoom.id, checkIn, checkOut);

            const req = mockRequest({}, {}, null, {
                checkIn: '2030-06-02',
                checkOut: '2030-06-04',
            });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            const roomIds = call.data.rooms.map((r: any) => r.id);
            expect(roomIds).not.toContain(bookedRoom.id);
            expect(roomIds).toContain(freeRoom.id);
        });

        it('should filter by capacity', async () => {
            await createTestRoom({ capacity: 1 });
            await createTestRoom({ capacity: 4 });

            const req = mockRequest({}, {}, null, { capacity: '3' });
            const res = mockResponse();

            await searchAvailableRooms(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            call.data.rooms.forEach((r: any) => expect(r.capacity).toBeGreaterThanOrEqual(3));
        });
    });

});
