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
router.post('/', createBooking);
router.get('/', getAllBookings); // Returns user's own bookings for guests, all bookings for admin
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

// Admin-only routes
router.post('/:id/check-in', authorize('admin', 'staff'), checkIn);
router.post('/:id/check-out', authorize('admin', 'staff'), checkOut);

export default router;
