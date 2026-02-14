import { Router } from 'express';
import {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    cancelBooking,
    checkIn,
    checkOut,
} from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Guest and Admin routes
/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: The booking was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', createBooking);
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Retrieve all bookings. Staff/Admins see all, Guests see their own.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', getAllBookings); // Returns user's own bookings for guests, all bookings for admin
/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: The booking description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', getBookingById);
/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: The booking was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/:id', updateBooking);
/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: The booking was cancelled
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', cancelBooking);

// Admin-only routes
/**
 * @swagger
 * /api/bookings/{id}/check-in:
 *   post:
 *     summary: Check-in a guest
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Checked in successfully
 *       400:
 *         description: Invalid booking status or too early
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/:id/check-in', authorize('admin', 'staff'), checkIn);
/**
 * @swagger
 * /api/bookings/{id}/check-out:
 *   post:
 *     summary: Check-out a guest
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Checked out successfully
 *       400:
 *         description: Invalid booking status
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/:id/check-out', authorize('admin', 'staff'), checkOut);

export default router;
