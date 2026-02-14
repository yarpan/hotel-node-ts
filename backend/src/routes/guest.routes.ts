import { Router } from 'express';
import {
    getAllGuests,
    getGuestById,
    updateGuest,
    getGuestBookings,
} from '../controllers/guest.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, authorize('admin', 'staff'));

/**
 * @swagger
 * tags:
 *   name: Guests
 *   description: Guest management (Admin/Staff only)
 */

/**
 * @swagger
 * /api/guests:
 *   get:
 *     summary: Get all guests
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of guests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', getAllGuests);
/**
 * @swagger
 * /api/guests/{id}:
 *   get:
 *     summary: Get guest by ID
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The guest ID
 *     responses:
 *       200:
 *         description: Guest details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Guest not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/:id', getGuestById);
/**
 * @swagger
 * /api/guests/{id}:
 *   put:
 *     summary: Update guest profile
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The guest ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Guest updated
 *       404:
 *         description: Guest not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.put('/:id', updateGuest);
/**
 * @swagger
 * /api/guests/{id}/bookings:
 *   get:
 *     summary: Get all bookings for a guest
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The guest ID
 *     responses:
 *       200:
 *         description: List of guest bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Guest not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/:id/bookings', getGuestBookings);

export default router;
