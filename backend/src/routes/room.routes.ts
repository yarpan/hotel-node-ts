import { Router } from 'express';
import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    searchAvailableRooms,
} from '../controllers/room.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room management
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       500:
 *         description: Server error
 */
router.get('/', getAllRooms);
/**
 * @swagger
 * /api/rooms/search:
 *   get:
 *     summary: Search available rooms
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of available rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/search', searchAvailableRooms);
/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room ID
 *     responses:
 *       200:
 *         description: Room data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getRoomById);

// Admin-only routes
/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room (Admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: Room created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, authorize('admin'), createRoom);
/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update a room (Admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: Room updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, authorize('admin'), updateRoom);
/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete a room (Admin only)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The room ID
 *     responses:
 *       200:
 *         description: Room deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

export default router;
