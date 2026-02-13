import { Request, Response } from 'express';
import User from '../models/User';
import Booking from '../models/Booking';

// Get all guests
export const getAllGuests = async (_req: Request, res: Response): Promise<void> => {
    try {
        const guests = await User.find({ role: 'guest' }).select('-password');

        res.status(200).json({
            status: 'success',
            results: guests.length,
            data: { guests },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get guests',
        });
    }
};

// Get guest by ID
export const getGuestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const guest = await User.findById(req.params.id).select('-password');

        if (!guest) {
            res.status(404).json({
                status: 'error',
                message: 'Guest not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: { guest },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get guest',
        });
    }
};

// Update guest
export const updateGuest = async (req: Request, res: Response): Promise<void> => {
    try {
        const guest = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!guest) {
            res.status(404).json({
                status: 'error',
                message: 'Guest not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Guest updated successfully',
            data: { guest },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update guest',
        });
    }
};

// Get guest bookings
export const getGuestBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const bookings = await Booking.find({ guestId: req.params.id })
            .populate('roomId', 'roomNumber type pricePerNight')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: { bookings },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get guest bookings',
        });
    }
};
