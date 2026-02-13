import { Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth';

// Create booking
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

        if (!req.user) {
            res.status(401).json({ status: 'error', message: 'Not authenticated' });
            return;
        }

        // Check if room exists
        const room = await Room.findById(roomId);
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

        const conflictingBooking = await Booking.findOne({
            roomId,
            status: { $in: ['confirmed', 'checked-in'] },
            $or: [
                { checkInDate: { $lte: checkOut }, checkOutDate: { $gte: checkIn } },
            ],
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
        const booking = await Booking.create({
            guestId: req.user._id,
            roomId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfGuests,
            totalPrice,
            specialRequests,
            status: 'confirmed',
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('roomId', 'roomNumber type')
            .populate('guestId', 'email profile');

        res.status(201).json({
            status: 'success',
            message: 'Booking created successfully',
            data: { booking: populatedBooking },
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
        const filter = req.user.role === 'guest' ? { guestId: req.user._id } : {};

        const bookings = await Booking.find(filter)
            .populate('roomId', 'roomNumber type pricePerNight')
            .populate('guestId', 'email profile')
            .sort({ createdAt: -1 });

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
        const booking = await Booking.findById(req.params.id)
            .populate('roomId')
            .populate('guestId', 'email profile');

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        // Check authorization
        if (
            req.user?.role === 'guest' &&
            booking.guestId._id.toString() !== req.user._id.toString()
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
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        // Check authorization
        if (
            req.user?.role === 'guest' &&
            booking.guestId.toString() !== req.user._id.toString()
        ) {
            res.status(403).json({
                status: 'error',
                message: 'You can only update your own bookings',
            });
            return;
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

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
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        // Check authorization
        if (
            req.user?.role === 'guest' &&
            booking.guestId.toString() !== req.user._id.toString()
        ) {
            res.status(403).json({
                status: 'error',
                message: 'You can only cancel your own bookings',
            });
            return;
        }

        booking.status = 'cancelled';
        await booking.save();

        res.status(200).json({
            status: 'success',
            message: 'Booking cancelled successfully',
            data: { booking },
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
        const booking = await Booking.findById(req.params.id);

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

        booking.status = 'checked-in';
        await booking.save();

        res.status(200).json({
            status: 'success',
            message: 'Guest checked in successfully',
            data: { booking },
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
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            res.status(404).json({ status: 'error', message: 'Booking not found' });
            return;
        }

        if (booking.status !== 'checked-in') {
            res.status(400).json({
                status: 'error',
                message: 'Only checked-in bookings can be checked out',
            });
            return;
        }

        booking.status = 'checked-out';
        await booking.save();

        res.status(200).json({
            status: 'success',
            message: 'Guest checked out successfully',
            data: { booking },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to check out',
        });
    }
};
