import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

// Get all rooms
export const getAllRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, status, minPrice, maxPrice } = req.query;

        // Build filter
        const where: any = {};
        if (type) where.type = type;
        if (status) where.status = status;
        
        if (minPrice || maxPrice) {
            where.pricePerNight = {};
            if (minPrice) where.pricePerNight.gte = Number(minPrice);
            if (maxPrice) where.pricePerNight.lte = Number(maxPrice);
        }

        const rooms = await prisma.room.findMany({ where });

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
        const id = Number(req.params.id);
        const room = await prisma.room.findUnique({ where: { id } });

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
        const where: any = { status: 'available' };
        if (type) where.type = type;
        if (capacity) where.capacity = { gte: Number(capacity) };

        // If dates provided, filter out rooms with conflicting bookings
        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn as string);
            const checkOutDate = new Date(checkOut as string);

            const rooms = await prisma.room.findMany({
                where: {
                    ...where,
                    bookings: {
                        none: {
                            status: { in: ['confirmed', 'checked_in' as any] },
                            OR: [
                                {
                                    checkInDate: { lte: checkOutDate },
                                    checkOutDate: { gte: checkInDate },
                                },
                            ],
                        },
                    },
                },
            });

            res.status(200).json({
                status: 'success',
                results: rooms.length,
                data: { rooms },
            });
            return;
        }

        const rooms = await prisma.room.findMany({ where });

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
        const room = await prisma.room.create({
            data: req.body,
        });

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
        const id = Number(req.params.id);
        const room = await prisma.room.update({
            where: { id },
            data: req.body,
        });

        res.status(200).json({
            status: 'success',
            message: 'Room updated successfully',
            data: { room },
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({
                status: 'error',
                message: 'Room not found',
            });
            return;
        }
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update room',
        });
    }
};

// Delete room (Admin)
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        await prisma.room.delete({ where: { id } });

        res.status(200).json({
            status: 'success',
            message: 'Room deleted successfully',
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({
                status: 'error',
                message: 'Room not found',
            });
            return;
        }
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete room',
        });
    }
};
