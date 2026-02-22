import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

// Get all guests
export const getAllGuests = async (_req: Request, res: Response): Promise<void> => {
    try {
        const guests = await prisma.user.findMany({
            where: { role: 'guest' },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                phone: true,
                street: true,
                city: true,
                state: true,
                country: true,
                zipCode: true,
                createdAt: true,
            }
        });

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
        const id = Number(req.params.id);
        const guest = await prisma.user.findFirst({
            where: { id, role: 'guest' },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                phone: true,
                street: true,
                city: true,
                state: true,
                country: true,
                zipCode: true,
                createdAt: true,
            }
        });

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
        const id = Number(req.params.id);
        const profileData = req.body;

        const guest = await prisma.user.update({
            where: { id },
            data: {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phone: profileData.phone,
                street: profileData.address?.street,
                city: profileData.address?.city,
                state: profileData.address?.state,
                country: profileData.address?.country,
                zipCode: profileData.address?.zipCode,
            },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                phone: true,
                street: true,
                city: true,
                state: true,
                country: true,
                zipCode: true,
                createdAt: true,
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Guest updated successfully',
            data: { guest },
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({
                status: 'error',
                message: 'Guest not found',
            });
            return;
        }
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to update guest',
        });
    }
};

// Get guest bookings
export const getGuestBookings = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const bookings = await prisma.booking.findMany({
            where: { guestId: id },
            include: {
                room: {
                    select: {
                        roomNumber: true,
                        type: true,
                        pricePerNight: true,
                    }
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
            message: error.message || 'Failed to get guest bookings',
        });
    }
};
