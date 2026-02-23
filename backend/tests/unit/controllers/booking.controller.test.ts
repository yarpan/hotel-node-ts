import { createBooking, getAllBookings } from '../../../src/controllers/booking.controller';
import prisma from '../../../src/utils/prismaClient';
import { mockRequest, mockResponse, createTestUser, createTestRoom } from '../../utils/testHelpers';

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

    describe('getAllBookings', () => {
        it('should return bookings for the authenticated guest', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();
            
            await prisma.booking.create({
                data: {
                    guestId: user.id,
                    roomId: room.id,
                    checkInDate: new Date(),
                    checkOutDate: new Date(),
                    numberOfGuests: 2,
                    totalPrice: 200,
                    status: 'confirmed',
                    paymentStatus: 'pending'
                }
            });

            const req = mockRequest({}, {}, user);
            const res = mockResponse();

            await getAllBookings(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'success',
                results: 1
            }));
        });
    });
});
