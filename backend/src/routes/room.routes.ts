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
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [single, double, suite, deluxe, presidential] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [available, occupied, maintenance] }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number, format: float, minimum: 0 }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number, format: float, minimum: 0 }
 *     responses:
 *       200:
 *         description: List of rooms
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
 *                     rooms:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Room' }
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: string, format: date }
 *         required: false
 *       - in: query
 *         name: checkOut
 *         schema: { type: string, format: date }
 *         required: false
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [single, double, suite, deluxe, presidential] }
 *       - in: query
 *         name: capacity
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: List of available rooms
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
 *                     rooms:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Room' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: integer, minimum: 1 }
 *         required: true
 *         description: The room ID
 *     responses:
 *       200:
 *         description: Room data
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
 *                         room: { $ref: '#/components/schemas/Room' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getRoomById);

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
 *                         room: { $ref: '#/components/schemas/Room' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: integer, minimum: 1 }
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
 *                         room: { $ref: '#/components/schemas/Room' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 *         schema: { type: integer, minimum: 1 }
 *         required: true
 *         description: The room ID
 *     responses:
 *       200:
 *         description: Room deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

export default router;
