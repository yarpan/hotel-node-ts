import { createBooking, getAllBookings, getBookingById, cancelBooking, checkIn, checkOut } from '../../../src/controllers/booking.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse, createTestUser, createTestRoom, createTestBooking } from '../../utils/testHelpers';

describe('Booking Controller - Edge Cases', () => {
    describe('createBooking - Edge Cases', () => {
        it('should return 400 when checkInDate is in the past', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const bookingData = {
                roomId: room.id,
                checkInDate: pastDate,
                checkOutDate: new Date(),
                numberOfGuests: 2
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when checkOutDate is before checkInDate', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 5);
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

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when checkInDate equals checkOutDate', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const sameDate = new Date();
            sameDate.setDate(sameDate.getDate() + 1);

            const bookingData = {
                roomId: room.id,
                checkInDate: sameDate,
                checkOutDate: sameDate,
                numberOfGuests: 2
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when numberOfGuests is zero', async () => {
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
                numberOfGuests: 0
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when numberOfGuests is negative', async () => {
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
                numberOfGuests: -1
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should not conflict with cancelled bookings', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkInDate = new Date('2030-08-01');
            const checkOutDate = new Date('2030-08-05');

            await createTestBooking(user.id, room.id, {
                checkInDate,
                checkOutDate,
                status: 'cancelled'
            });

            const req = mockRequest(
                {
                    roomId: room.id,
                    checkInDate: '2030-08-02',
                    checkOutDate: '2030-08-04',
                    numberOfGuests: 1
                },
                {},
                user
            );
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle booking for maximum room capacity', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom({ capacity: 4 });

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 1);
            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 3);

            const bookingData = {
                roomId: room.id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 4
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should handle booking with special requests', async () => {
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
                numberOfGuests: 2,
                specialRequests: 'Late check-in, extra pillows'
            };

            const req = mockRequest(bookingData, {}, user);
            const res = mockResponse();

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('getAllBookings - Edge Cases', () => {
        it('should return empty array when no bookings exist', async () => {
            const { user } = await createTestUser();

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getAllBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: 0
            }));
        });

        it('should not return other guests bookings to a guest user', async () => {
            const { user: guest1 } = await createTestUser('guest');
            const { user: guest2 } = await createTestUser('guest');
            const room = await createTestRoom();

            await createTestBooking(guest2.id, room.id);

            const req = mockRequest({}, {}, guest1);
            const res = mockResponse();

            await getAllBookings(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.results).toBe(0);
        });

        it('should handle admin viewing all bookings including cancelled ones', async () => {
            const { user: guest } = await createTestUser('guest');
            const { user: admin } = await createTestUser('admin');
            const room = await createTestRoom();

            await createTestBooking(guest.id, room.id, { status: 'confirmed' });
            await createTestBooking(guest.id, room.id, { status: 'cancelled' });

            const req = mockRequest({}, {}, admin);
            const res = mockResponse();

            await getAllBookings(req, res);

            const call = (res.json as jest.Mock).mock.calls[0][0];
            expect(call.results).toBeGreaterThanOrEqual(2);
        });
    });

    describe('getBookingById - Edge Cases', () => {
        it('should allow admin to view any booking', async () => {
            const { user: guest } = await createTestUser('guest');
            const { user: admin } = await createTestUser('admin');
            const room = await createTestRoom();
            const booking = await createTestBooking(guest.id, room.id);

            const req = mockRequest({}, { id: booking.id }, admin);
            const res = mockResponse();

            await getBookingById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 for invalid booking ID format', async () => {
            const { user } = await createTestUser();

            const req = mockRequest({}, { id: 'invalid' }, user);
            const res = mockResponse();

            await getBookingById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('cancelBooking - Edge Cases', () => {
        it('should allow admin to cancel any booking', async () => {
            const { user: guest } = await createTestUser('guest');
            const { user: admin } = await createTestUser('admin');
            const room = await createTestRoom();
            const booking = await createTestBooking(guest.id, room.id);

            const req = mockRequest({}, { id: booking.id }, admin);
            const res = mockResponse();

            await cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
            expect(updated?.status).toBe('cancelled');
        });

        it('should return 400 when trying to cancel already cancelled booking', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            const booking = await createTestBooking(user.id, room.id, { status: 'cancelled' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when trying to cancel checked-in booking', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            const booking = await createTestBooking(user.id, room.id, { status: 'checked_in' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when trying to cancel checked-out booking', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            const booking = await createTestBooking(user.id, room.id, { status: 'checked_out' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await cancelBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('checkIn - Edge Cases', () => {
        it('should return 404 for non-existent booking', async () => {
            const { user } = await createTestUser();

            const req = mockRequest({}, { id: 999999 }, user);
            const res = mockResponse();

            await checkIn(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 when trying to check in already checked-in booking', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            const booking = await createTestBooking(user.id, room.id, { status: 'checked_in' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await checkIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 when trying to check in checked-out booking', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            const booking = await createTestBooking(user.id, room.id, { status: 'checked_out' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await checkIn(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should update room status to occupied after check-in', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom({ status: 'available' });
            const booking = await createTestBooking(user.id, room.id, { status: 'confirmed' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await checkIn(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('checkOut - Edge Cases', () => {
        it('should return 404 for non-existent booking', async () => {
            const { user } = await createTestUser();

            const req = mockRequest({}, { id: 999999 }, user);
            const res = mockResponse();

            await checkOut(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 400 when trying to check out already checked-out booking', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            const booking = await createTestBooking(user.id, room.id, { status: 'checked_out' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await checkOut(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should update room status to available after check-out', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom({ status: 'occupied' });
            const booking = await createTestBooking(user.id, room.id, { status: 'checked_in' });

            const req = mockRequest({}, { id: booking.id }, user);
            const res = mockResponse();

            await checkOut(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
