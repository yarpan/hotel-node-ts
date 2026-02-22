import jwt from 'jsonwebtoken';
import prisma from '../../src/utils/prismaClient';

/**
 * Create a test user with specified role
 * @param role - User role (guest, admin, or staff)
 * @returns User data and JWT token
 */
export const createTestUser = async (role: 'guest' | 'admin' | 'staff' = 'guest') => {
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: 'password123',
            role,
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890'
        }
    });

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );

    return { user, token };
};

/**
 * Create a test room with default or custom properties
 * @param overrides - Optional properties to override defaults
 * @returns Room data
 */
export const createTestRoom = async (overrides: any = {}) => {
    return await prisma.room.create({
        data: {
            roomNumber: `${Math.floor(Math.random() * 10000)}`,
            type: 'single',
            capacity: 2,
            pricePerNight: 100,
            amenities: ['WiFi', 'TV'],
            description: 'Test room',
            status: 'available',
            ...overrides
        }
    });
};

/**
 * Create a test booking for a guest and room
 * @param guestId - User ID of the guest
 * @param roomId - Room ID
 * @param overrides - Optional properties to override defaults
 * @returns Booking data
 */
export const createTestBooking = async (guestId: number, roomId: number, overrides: any = {}) => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1); // Tomorrow

    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3); // 3 days from now

    return await prisma.booking.create({
        data: {
            guestId,
            roomId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfGuests: 2,
            totalPrice: 200,
            status: 'confirmed',
            paymentStatus: 'pending',
            ...overrides
        }
    });
};

/**
 * Create a booking with specific dates
 * @param guestId - User ID
 * @param roomId - Room ID
 * @param checkInDate - Check-in date
 * @param checkOutDate - Check-out date
 * @returns Booking data
 */
export const createBookingWithDates = async (
    guestId: number,
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date
) => {
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return await prisma.booking.create({
        data: {
            guestId,
            roomId,
            checkInDate,
            checkOutDate,
            numberOfGuests: 2,
            totalPrice: nights * 100,
            status: 'confirmed',
            paymentStatus: 'pending'
        }
    });
};

/**
 * Mock Express Request object
 */
export const mockRequest = (body: any = {}, params: any = {}, user: any = null) => ({
    body,
    params,
    user,
    headers: {
        authorization: user ? 'Bearer mock-token' : undefined
    }
} as any);

/**
 * Mock Express Response object
 */
export const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};
