import { Router } from 'express';
import {
    getAllGuests,
    getGuestById,
    updateGuest,
    getGuestBookings,
} from '../controllers/guest.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin/staff role
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
 *               type: object
 *               properties:
 *                 status:  { type: string, example: success }
 *                 results: { type: integer }
 *                 data:
 *                   type: object
 *                   properties:
 *                     guests:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: integer, minimum: 1 }
 *         required: true
 *         description: The guest ID
 *     responses:
 *       200:
 *         description: Guest details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         guest: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: integer, minimum: 1 }
 *         required: true
 *         description: The guest ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName:  { type: string }
 *               phone:     { type: string }
 *               address:
 *                 type: object
 *                 properties:
 *                   street:  { type: string }
 *                   city:    { type: string }
 *                   state:   { type: string }
 *                   country: { type: string }
 *                   zipCode: { type: string }
 *     responses:
 *       200:
 *         description: Guest updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         guest: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: integer, minimum: 1 }
 *         required: true
 *         description: The guest ID
 *     responses:
 *       200:
 *         description: List of guest bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:  { type: string, example: success }
 *                 results: { type: integer }
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Booking' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/bookings', getGuestBookings);

export default router;
