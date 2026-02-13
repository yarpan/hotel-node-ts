import { Request, Response } from 'express';
import Room from '../models/Room';
import Booking from '../models/Booking';

// Get all rooms
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, status, minPrice, maxPrice } = req.query;

        // Build filter
        const filter: any = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (minPrice || maxPrice) {
            filter.pricePerNight = {};
            if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
            if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
        }

        const rooms = await Room.find(filter);

        res.status(200).json({
            status: 'success',
            results: rooms.length,
            data: { rooms },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get rooms',
        });
    }
};

// Get room by ID
export const getRoomById = async (req: Request, res: Response): Promise<void> => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            res.status(404).json({
                status: 'error',
                message: 'Room not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: { room },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to get room',
        });
    }
};

// Search available rooms
export const searchAvailableRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { checkIn, checkOut, type, capacity } = req.query;

        // Build room filter
        const filter: any = { status: 'available' };
        if (type) filter.type = type;
        if (capacity) filter.capacity = { $gte: Number(capacity) };

        const rooms = await Room.find(filter);

        // If dates provided, filter out rooms with conflicting bookings
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn as string);
            const checkOutDate = new Date(checkOut as string);

            const conflictingBookings = await Booking.find({
                status: { $in: ['confirmed', 'checked-in'] },
                $or: [
                    {
                        checkInDate: { $lte: checkOutDate },
                        checkOutDate: { $gte: checkInDate },
                    },
                ],
            }).select('roomId');

            const bookedRoomIds = conflictingBookings.map((b) => b.roomId.toString());
            const availableRooms = rooms.filter(
                (room) => !bookedRoomIds.includes(room._id.toString())
            );

            res.status(200).json({
                status: 'success',
                results: availableRooms.length,
                data: { rooms: availableRooms },
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            results: rooms.length,
            data: { rooms },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to search rooms',
        });
    }
};

// Create room (Admin)
export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const room = await Room.create(req.body);

        res.status(201).json({
            status: 'success',
            message: 'Room created successfully',
            data: { room },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create room',
        });
    }
};

// Update room (Admin)
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!room) {
            res.status(404).json({
                status: 'error',
                message: 'Room not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Room updated successfully',
            data: { room },
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update room',
        });
    }
};

// Delete room (Admin)
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);

        if (!room) {
            res.status(404).json({
                status: 'error',
                message: 'Room not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Room deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete room',
        });
    }
};
