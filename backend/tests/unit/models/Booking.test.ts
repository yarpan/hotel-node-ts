import Booking from '../../../src/models/Booking';
import { createTestUser, createTestRoom } from '../../utils/testHelpers';

describe('Booking Model', () => {
    describe('Validation', () => {
        it('should create a booking with valid data', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 1);

            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 3);

            const booking = await Booking.create({
                guestId: user._id,
                roomId: room._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200,
                status: 'confirmed',
                paymentStatus: 'pending'
            });

            expect(booking.guestId.toString()).toBe(user._id.toString());
            expect(booking.roomId.toString()).toBe(room._id.toString());
            expect(booking.numberOfGuests).toBe(2);
            expect(booking.totalPrice).toBe(200);
            expect(booking.status).toBe('confirmed');
        });

        it('should require guestId', async () => {
            const room = await createTestRoom();

            const checkIn = new Date();
            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 2);

            const booking = new Booking({
                roomId: room._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200
            });

            await expect(booking.save()).rejects.toThrow();
        });

        it('should require roomId', async () => {
            const { user } = await createTestUser();

            const checkIn = new Date();
            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 2);

            const booking = new Booking({
                guestId: user._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200
            });

            await expect(booking.save()).rejects.toThrow();
        });

        it('should require checkInDate', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 2);

            const booking = new Booking({
                guestId: user._id,
                roomId: room._id,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200
            });

            await expect(booking.save()).rejects.toThrow();
        });

        it('should require checkOutDate', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();

            const booking = new Booking({
                guestId: user._id,
                roomId: room._id,
                checkInDate: checkIn,
                numberOfGuests: 2,
                totalPrice: 200
            });

            await expect(booking.save()).rejects.toThrow();
        });
    });

    describe('Date Validation', () => {
        it('should reject booking where checkOut is before checkIn', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 5);

            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 2); // Before check-in

            const booking = new Booking({
                guestId: user._id,
                roomId: room._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200
            });

            await expect(booking.save()).rejects.toThrow();
        });

        it('should reject booking where checkOut equals checkIn', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const sameDate = new Date();
            sameDate.setDate(sameDate.getDate() + 1);

            const booking = new Booking({
                guestId: user._id,
                roomId: room._id,
                checkInDate: sameDate,
                checkOutDate: sameDate,
                numberOfGuests: 2,
                totalPrice: 200
            });

            await expect(booking.save()).rejects.toThrow();
        });

        it('should accept valid date range', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 1);

            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 5);

            const booking = await Booking.create({
                guestId: user._id,
                roomId: room._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 400
            });

            expect(booking.checkOutDate.getTime()).toBeGreaterThan(booking.checkInDate.getTime());
        });
    });

    describe('Status', () => {
        it('should accept valid booking statuses', async () => {
            const { user } = await createTestUser();
            const statuses: Array<'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'> =
                ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

            for (const status of statuses) {
                const room = await createTestRoom();
                const checkIn = new Date();
                checkIn.setDate(checkIn.getDate() + 1);
                const checkOut = new Date();
                checkOut.setDate(checkOut.getDate() + 3);

                const booking = await Booking.create({
                    guestId: user._id,
                    roomId: room._id,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    numberOfGuests: 2,
                    totalPrice: 200,
                    status
                });

                expect(booking.status).toBe(status);
            }
        });

        it('should reject invalid status', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 1);
            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 3);

            const booking = new Booking({
                guestId: user._id,
                roomId: room._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200,
                status: 'invalid-status' as any
            });

            await expect(booking.save()).rejects.toThrow();
        });
    });

    describe('Payment Status', () => {
        it('should accept valid payment statuses', async () => {
            const { user } = await createTestUser();
            const paymentStatuses: Array<'pending' | 'paid' | 'refunded'> = ['pending', 'paid', 'refunded'];

            for (const paymentStatus of paymentStatuses) {
                const room = await createTestRoom();
                const checkIn = new Date();
                checkIn.setDate(checkIn.getDate() + 1);
                const checkOut = new Date();
                checkOut.setDate(checkOut.getDate() + 3);

                const booking = await Booking.create({
                    guestId: user._id,
                    roomId: room._id,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    numberOfGuests: 2,
                    totalPrice: 200,
                    paymentStatus
                });

                expect(booking.paymentStatus).toBe(paymentStatus);
            }
        });
    });

    describe('Timestamps', () => {
        it('should have createdAt and updatedAt timestamps', async () => {
            const { user } = await createTestUser();
            const room = await createTestRoom();

            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 1);
            const checkOut = new Date();
            checkOut.setDate(checkOut.getDate() + 3);

            const booking = await Booking.create({
                guestId: user._id,
                roomId: room._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests: 2,
                totalPrice: 200
            });

            expect(booking.createdAt).toBeDefined();
            expect(booking.updatedAt).toBeDefined();
            expect(booking.createdAt).toBeInstanceOf(Date);
            expect(booking.updatedAt).toBeInstanceOf(Date);
        });
    });
});
