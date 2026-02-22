import { Response } from 'express';
import prisma from '../utils/prismaClient';
import { AuthRequest } from '../middleware/auth';

// Create booking
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

        if (!req.user) {
            res.status(401).json({ status: 'error', message: 'Not authenticated' });
            return;
        }

        const roomIntId = Number(roomId);

        // Check if room exists
        const room = await prisma.room.findUnique({ where: { id: roomIntId } });
        if (!room) {
            res.status(404).json({ status: 'error', message: 'Room not found' });
            return;
        }

        // Check room capacity
        if (numberOfGuests > room.capacity) {
            res.status(400).json({
                status: 'error',
                message: `Room capacity is ${room.capacity} guests`,
            });
            return;
        }

        // Check for conflicting bookings
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                roomId: roomIntId,
                status: { in: ['confirmed', 'checked_in' as any] },
                OR: [
                    {
                        checkInDate: { lte: checkOut },
                        checkOutDate: { gte: checkIn },
                    },
                ],
            },
        });

        if (conflictingBooking) {
            res.status(409).json({
                status: 'error',
                message: 'Room is not available for selected dates',
            });
            return;
        }

        // Calculate total price
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * room.pricePerNight;

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                guestId: req.user.id,
                roomId: roomIntId,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                numberOfGuests,
                totalPrice,
                specialRequests,
                status: 'confirmed',
            },
            include: {
                room: {
                    select: { roomNumber: true, type: true }
                },
                guest: {
                    select: { email: true, firstName: true, lastName: true }
                }
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Booking created successfully',
            data: { booking },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create booking',
        });
    }
};

// Get all bookings
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ status: 'error', message: 'Not authenticated' });
            return;
        }

        // Guests see only their bookings, admins see all
        const where = req.user.role === 'guest' ? { guestId: req.user.id } : {};

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                room: {
                    select: { roomNumber: true, type: true, pricePerNight: true }
                },
                guest: {
                    select: { email: true, firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: { bookings },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get bookings',
        });
    }
};

// Get booking by ID
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                room: true,
                guest: {
                    select: { email: true, firstName: true, lastName: true }
                }
            }
        });

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        // Check authorization
        if (
            req.user?.role === 'guest' &&
            booking.guestId !== req.user.id
        ) {
            res.status(403).json({
                status: 'error',
                message: 'You can only view your own bookings',
            });
            return;
        }

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get booking',
        });
    }
};

// Update booking
export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const booking = await prisma.booking.findUnique({ where: { id } });

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        // Check authorization
        if (
            req.user?.role === 'guest' &&
            booking.guestId !== req.user.id
        ) {
            res.status(403).json({
                status: 'error',
                message: 'You can only update your own bookings',
            });
            return;
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: req.body,
        });

        res.status(200).json({
            status: 'success',
            message: 'Booking updated successfully',
            data: { booking: updatedBooking },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update booking',
        });
    }
};

// Cancel booking
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const booking = await prisma.booking.findUnique({ where: { id } });

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        // Check authorization
        if (
            req.user?.role === 'guest' &&
            booking.guestId !== req.user.id
        ) {
            res.status(403).json({
                status: 'error',
                message: 'You can only cancel your own bookings',
            });
            return;
        }

        const cancelledBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        res.status(200).json({
            status: 'success',
            message: 'Booking cancelled successfully',
            data: { booking: cancelledBooking },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to cancel booking',
        });
    }
};

// Check-in (Admin)
export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const booking = await prisma.booking.findUnique({ where: { id } });

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        if (booking.status !== 'confirmed') {
            res.status(400).json({
                status: 'error',
                message: 'Only confirmed bookings can be checked in',
            });
            return;
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'checked_in' as any }
        });

        res.status(200).json({
            status: 'success',
            message: 'Guest checked in successfully',
            data: { booking: updatedBooking },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to check in',
        });
    }
};

// Check-out (Admin)
export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const booking = await prisma.booking.findUnique({ where: { id } });

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        if (booking.status !== 'checked_in' as any) {
            res.status(400).json({
                status: 'error',
                message: 'Only checked-in bookings can be checked out',
            });
            return;
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'checked_out' as any }
        });

        res.status(200).json({
            status: 'success',
            message: 'Guest checked out successfully',
            data: { booking: updatedBooking },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to check out',
        });
    }
};
