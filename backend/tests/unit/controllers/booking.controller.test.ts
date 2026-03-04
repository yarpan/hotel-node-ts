import { createBooking, getAllBookings, getBookingById, cancelBooking, checkIn, checkOut } from '../../../src/controllers/booking.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse, createTestUser, createTestRoom, createTestBooking } from '../../utils/testHelpers';

describe('Booking Controller', () => {
    describe('createBooking', () => {
        it('should create a booking successfully', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            
            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 1);
            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 3);

            const bookingData = {
                roomId: room.id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                message: 'Booking created successfully'
            }));

            const bookingInDb = await prisma.booking.findFirst({ where: { guestId: user.id } });
            expect(bookingInDb).toBeDefined();
            expect(bookingInDb?.roomId).toBe(room.id);
        });

        it('should return 404 if room does not exist', async () => {
            const { user } = await createTestUser();
            
            const bookingData = {
                roomId: 999999, // Non-existent integer ID
                checkInDate: new Date(),
                checkOutDate: new Date(),
                numberOfGuests: 2
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    it('should return 409 when dates conflict with an existing booking', async () => {
        const { user } = await createTestUser();
        const room = await createTestRoom();

        const checkInDate = new Date('2030-07-01');
        const checkOutDate = new Date('2030-07-05');

        await createTestBooking(user.id, room.id, {
            checkInDate,
            checkOutDate,
            status: 'confirmed',
        });

        const req = mockRequest(
            {
                roomId: room.id,
                checkInDate: '2030-07-03',
                checkOutDate: '2030-07-07',
                numberOfGuests: 1,
            },
            {},
            user
        );
        const res = mockResponse();

        await createBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 'error',
            message: 'Room is not available for selected dates',
        }));
    });

    it('should return 400 when numberOfGuests exceeds room capacity', async () => {
        const { user } = await createTestUser();
        const room = await createTestRoom({ capacity: 2 });

        const req = mockRequest(
            {
                roomId: room.id,
                checkInDate: new Date(),
                checkOutDate: new Date(),
                numberOfGuests: 5,
            },
            {},
            user
        );
        const res = mockResponse();

        await createBooking(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: 'error',
            message: expect.stringContaining('capacity'),
        }));
    });

    describe('getAllBookings', () => {
        it('should return only the guest\'s own bookings', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            await createTestBooking(user.id, room.id);

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getAllBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: 1,
            }));
        });

        it('should return all bookings for an admin', async () => {
            const { user: guest1 } = await createTestUser('guest');
            const { user: guest2 } = await createTestUser('guest');
            const { user: admin } = await createTestUser('admin');
            const room = await createTestRoom();

            await createTestBooking(guest1.id, room.id);
            await createTestBooking(guest2.id, room.id);

            const req = mockRequest({}, {}, admin);
            const res = mockResponse();

            await getAllBookings(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(res.status).toHaveBeenCalledWith(200);
            expect(call.results).toBeGreaterThanOrEqual(2);
        });
    });

});
